import { appUrl, authenticate, endpoint, HttpError, json, serviceClient } from "../_shared/http.ts";
import { stripeClient } from "../_shared/stripe.ts";
Deno.serve(endpoint(async (req) => {
  const { user } = await authenticate(req);
  const { data, error } = await serviceClient().from("subscribers").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (error) throw new HttpError(503, "Unable to load billing account");
  if (!data?.stripe_customer_id) throw new HttpError(404, "No billing account found");
  const stripe = stripeClient();
  const customer = await stripe.customers.retrieve(data.stripe_customer_id);
  if (customer.deleted || customer.metadata.user_id !== user.id) throw new HttpError(403, "Billing account ownership could not be verified");
  const session = await stripe.billingPortal.sessions.create({ customer: customer.id, return_url: `${appUrl()}/settings` });
  return json(req, { url: session.url });
}));
