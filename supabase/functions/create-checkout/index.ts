import { appUrl, authenticate, endpoint, HttpError, json, jsonBody, serviceClient } from "../_shared/http.ts";
import { plans, priceFor, stripeClient, type Plan, Stripe } from "../_shared/stripe.ts";
Deno.serve(endpoint(async (req) => {
  const { user } = await authenticate(req);
  if (!user.email || !user.email_confirmed_at) throw new HttpError(403, "A verified email is required for billing");
  const body = await jsonBody(req, 4096);
  if (!plans.includes(body.planType as Plan)) throw new HttpError(400, "Invalid subscription plan");
  const plan = body.planType as Plan;
  const price = priceFor(plan);
  const baseUrl = appUrl();
  const stripe = stripeClient();
  const admin = serviceClient();
  const { data: existing, error } = await admin.from("subscribers").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (error) throw new HttpError(503, "Unable to load billing account");
  let customerId = existing?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } }, { idempotencyKey: `deepflow-customer-${user.id}` });
    customerId = customer.id;
    const { error: saveError } = await admin.from("subscribers").upsert({ user_id: user.id, email: user.email, stripe_customer_id: customerId, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (saveError) throw new HttpError(503, "Unable to save billing account");
  }
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted || customer.metadata.user_id !== user.id) throw new HttpError(403, "Billing account ownership could not be verified");
  const active = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
  if (active.has_more || active.data.some((subscription: Stripe.Subscription) => ["active", "trialing", "past_due", "unpaid", "incomplete", "paused"].includes(subscription.status))) throw new HttpError(409, "Manage your existing subscription in the customer portal");
  const session = await stripe.checkout.sessions.create({
    customer: customerId, client_reference_id: user.id, mode: "subscription", line_items: [{ price, quantity: 1 }],
    success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/payment-canceled`, metadata: { user_id: user.id, plan }, subscription_data: { metadata: { user_id: user.id } },
  }, { idempotencyKey: `deepflow-checkout-${user.id}-${plan}-${Math.floor(Date.now() / 300000)}` });
  return json(req, { url: session.url });
}));
