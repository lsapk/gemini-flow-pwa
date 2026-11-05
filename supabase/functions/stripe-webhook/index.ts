import { HttpError, json, requiredEnv, serviceClient } from "../_shared/http.ts";
import { readText } from "../_shared/validation.ts";
import { planFor, Stripe, stripeClient } from "../_shared/stripe.ts";

// Stripe authenticates this endpoint by its signed raw body, not a Supabase JWT.
Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") throw new HttpError(405, "Method not allowed");
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new HttpError(400, "Stripe signature required");
    const stripe = stripeClient();
    const raw = await readText(req, 256 * 1024);
    const signingSecret = requiredEnv("STRIPE_WEBHOOK_SECRET");
    let event: Stripe.Event;
    try { event = await stripe.webhooks.constructEventAsync(raw, signature, signingSecret, 300, Stripe.createSubtleCryptoProvider()); }
    catch { throw new HttpError(400, "Invalid Stripe signature"); }
    let subscriptionId: string | null = null;
    if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) subscriptionId = (event.data.object as Stripe.Subscription).id;
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
    }
    if (!subscriptionId) return json(req, { received: true });
    // Retrieve authoritative state; never trust a browser success redirect.
    let subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    const admin = serviceClient();
    const { data: owner, error } = await admin.from("subscribers").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
    if (error || !owner?.user_id) throw new HttpError(503, "Billing account mapping unavailable");
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted || customer.metadata.user_id !== owner.user_id || subscription.metadata.user_id !== owner.user_id) throw new HttpError(400, "Subscription ownership mismatch");
    // A late cancellation for an older subscription must not revoke a newer,
    // still-active purchase for the same customer.
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
    if (subscriptions.has_more) throw new HttpError(503, "Billing account needs reconciliation");
    const priority: Record<string, number> = { basic: 1, premium: 2, ultimate: 3 };
    const eligible = subscriptions.data.filter((item: Stripe.Subscription) => item.metadata.user_id === owner.user_id && item.items.data.length === 1 && planFor(item.items.data[0].price.id) && ["active", "trialing"].includes(item.status) && item.current_period_end * 1000 > Date.now());
    eligible.sort((a: Stripe.Subscription, b: Stripe.Subscription) => priority[planFor(b.items.data[0].price.id)!] - priority[planFor(a.items.data[0].price.id)!]);
    if (eligible.length) subscription = eligible[0];
    const plan = subscription.items.data.length === 1 ? planFor(subscription.items.data[0].price.id) : null;
    const active = !!plan && ["active", "trialing"].includes(subscription.status) && subscription.current_period_end * 1000 > Date.now();
    const { error: applyError } = await admin.rpc("apply_stripe_subscription", {
      p_event_id: event.id, p_event_created: event.created, p_user_id: owner.user_id, p_customer_id: customerId,
      p_subscription_id: subscription.id, p_subscribed: active, p_tier: plan,
      p_subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
    });
    if (applyError) throw new HttpError(503, "Unable to update subscription");
    return json(req, { received: true });
  } catch (error) {
    const known = error instanceof HttpError;
    if (!known) console.error("Stripe webhook processing failed");
    return json(req, { error: known ? error.message : "Webhook temporarily unavailable" }, known ? error.status : 503);
  }
});
