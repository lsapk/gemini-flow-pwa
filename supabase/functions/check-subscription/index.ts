import { authenticate, endpoint, HttpError, json } from "../_shared/http.ts";
Deno.serve(endpoint(async (req) => {
  const { client, user } = await authenticate(req);
  const { data, error } = await client.from("subscribers").select("subscribed,subscription_tier,subscription_end,stripe_verified_at").eq("user_id", user.id).maybeSingle();
  if (error) throw new HttpError(503, "Unable to verify subscription");
  const subscribed = data?.subscribed === true && !!data.stripe_verified_at && !!data.subscription_end && Date.parse(data.subscription_end) > Date.now();
  return json(req, { subscribed, subscription_tier: subscribed ? data?.subscription_tier : null, subscription_end: subscribed ? data?.subscription_end : null });
}));
