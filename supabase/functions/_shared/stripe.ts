import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { HttpError, requiredEnv } from "./http.ts";

export const plans = ["basic", "premium", "ultimate", "premium_monthly", "premium_yearly"] as const;
export type Plan = typeof plans[number];
export function stripeClient() {
  return new Stripe(requiredEnv("STRIPE_SECRET_KEY"), { apiVersion: "2023-10-16", httpClient: Stripe.createFetchHttpClient(), timeout: 15000, maxNetworkRetries: 1 });
}
export function priceFor(plan: Plan): string {
  const price = requiredEnv(`STRIPE_PRICE_${plan.toUpperCase()}`);
  if (!/^price_[A-Za-z0-9]+$/.test(price)) throw new HttpError(503, "Billing prices are not configured");
  return price;
}
export function planFor(priceId: string): Plan | null {
  const plan = plans.find((plan) => Deno.env.get(`STRIPE_PRICE_${plan.toUpperCase()}`) === priceId);
  return plan === "premium_monthly" || plan === "premium_yearly" ? "premium" : plan ?? null;
}
export { Stripe };
