import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!stripeSecretKey || !webhookSecret) {
      throw new Error("Stripe keys not configured");
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const productId = session.metadata?.product_id || "";

        if (!userId) break;

        // Determine tier and end date
        let tier = "premium";
        let endDate: string | null = null;

        if (productId.includes("monthly")) {
          endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        } else if (productId.includes("yearly")) {
          endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        } else if (productId.includes("lifetime")) {
          endDate = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
        }

        await supabase.from("subscribers").upsert({
          user_id: userId,
          subscribed: true,
          subscription_tier: tier,
          subscription_end: endDate,
          stripe_customer_id: session.customer as string,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        console.log(`Subscription activated for user ${userId} — ${productId}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by stripe_customer_id
        const { data: subscriber } = await supabase
          .from("subscribers")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (subscriber) {
          await supabase.from("subscribers").update({
            subscribed: false,
            subscription_tier: "basic",
            subscription_end: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq("user_id", subscriber.user_id);

          console.log(`Subscription cancelled for user ${subscriber.user_id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", (error as Error).message);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
