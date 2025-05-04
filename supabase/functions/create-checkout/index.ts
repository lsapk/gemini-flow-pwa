
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    
    // Create Supabase client with anon key for user auth
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "");
    
    // Get authenticated user from Authorization header
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
    
    // Get product info from request body
    const { productId } = await req.json();
    
    // Determine Stripe price ID based on productId
    let priceId;
    let mode: "payment" | "subscription";
    
    if (productId.includes("monthly")) {
      priceId = "price_monthly"; // Replace with actual Stripe price ID
      mode = "subscription";
    } else if (productId.includes("yearly")) {
      priceId = "price_yearly"; // Replace with actual Stripe price ID
      mode = "subscription";
    } else if (productId.includes("lifetime")) {
      priceId = "price_lifetime"; // Replace with actual Stripe price ID
      mode = "payment"; // One-time payment
    } else {
      throw new Error("Invalid product ID");
    }

    // Check if a customer already exists for this user
    const { data: customerData } = await supabase
      .from('subscribers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();
      
    let customerId = customerData?.stripe_customer_id;
    
    // If no Stripe customer exists, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id
        }
      });
      
      customerId = customer.id;
      
      // Create Supabase service client to update subscriber table
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      // Store the Stripe customer ID in the subscribers table
      await supabaseAdmin
        .from('subscribers')
        .upsert({
          user_id: user.id,
          email: user.email,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    }

    // Create Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled`,
      metadata: {
        user_id: user.id,
        product_id: productId
      }
    });

    // Return the checkout URL
    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
