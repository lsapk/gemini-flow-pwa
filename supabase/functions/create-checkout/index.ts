
import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Read price IDs from environment variables
const PRICE_IDS: Record<string, { priceId: string; mode: "payment" | "subscription" }> = {
  monthly: { priceId: Deno.env.get("STRIPE_PRICE_MONTHLY") || "", mode: "subscription" },
  yearly: { priceId: Deno.env.get("STRIPE_PRICE_YEARLY") || "", mode: "subscription" },
  lifetime: { priceId: Deno.env.get("STRIPE_PRICE_LIFETIME") || "", mode: "payment" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!stripeSecretKey) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "");
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header is required");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Authentication failed");
    }
    
    const user = userData.user;
    const { productId } = await req.json();
    
    // Determine price config from env vars
    let priceConfig: { priceId: string; mode: "payment" | "subscription" } | undefined;
    
    if (productId.includes("monthly")) {
      priceConfig = PRICE_IDS.monthly;
    } else if (productId.includes("yearly")) {
      priceConfig = PRICE_IDS.yearly;
    } else if (productId.includes("lifetime")) {
      priceConfig = PRICE_IDS.lifetime;
    }

    if (!priceConfig || !priceConfig.priceId) {
      throw new Error("Invalid product ID or price not configured. Set STRIPE_PRICE_MONTHLY, STRIPE_PRICE_YEARLY, STRIPE_PRICE_LIFETIME in Edge Function secrets.");
    }

    // Check if a customer already exists for this user
    const { data: customerData } = await supabase
      .from('subscribers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();
      
    let customerId = customerData?.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      });
      
      customerId = customer.id;
      
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabaseAdmin
        .from('subscribers')
        .upsert({
          user_id: user.id,
          email: user.email,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceConfig.priceId, quantity: 1 }],
      mode: priceConfig.mode,
      success_url: `${req.headers.get("origin")}/settings?payment=success`,
      cancel_url: `${req.headers.get("origin")}/settings?payment=cancelled`,
      metadata: { user_id: user.id, product_id: productId }
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating checkout session:", (error as Error).message);
    
    return new Response(
      JSON.stringify({ error: "Une erreur est survenue lors de la création de la session de paiement." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
