
import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Define CORS headers for browser access
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
    // Initialize Supabase client with service role for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { purchaseInfo } = await req.json();
    
    if (!purchaseInfo || !purchaseInfo.productId) {
      return new Response(
        JSON.stringify({ error: "Invalid purchase information" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract user info from the Authorization header or purchase info
    let userId;
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(token);
      userId = data?.user?.id;
    } else if (purchaseInfo.userId) {
      userId = purchaseInfo.userId;
    }
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User identification required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determine subscription info from product ID
    let subscriptionTier = "basic";
    let subscriptionEnd = null;
    
    if (purchaseInfo.productId.includes("monthly")) {
      subscriptionTier = "monthly";
      // Set subscription end to 1 month from now
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      subscriptionEnd = endDate.toISOString();
    } else if (purchaseInfo.productId.includes("yearly")) {
      subscriptionTier = "yearly";
      // Set subscription end to 1 year from now
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      subscriptionEnd = endDate.toISOString();
    } else if (purchaseInfo.productId.includes("lifetime")) {
      subscriptionTier = "lifetime";
      // Lifetime subscription doesn't expire
      subscriptionEnd = null;
    }

    // Get the user's email
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();
      
    if (userError || !userData) {
      console.error("Error fetching user email:", userError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update or create subscription record
    const { data, error } = await supabase
      .from('subscribers')
      .upsert({
        user_id: userId,
        email: userData.email,
        subscribed: true,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id',
        returning: 'minimal'
      });
      
    if (error) {
      throw error;
    }

    // Log the purchase for reference
    await supabase
      .from('subscription_history')
      .insert({
        user_id: userId,
        product_id: purchaseInfo.productId,
        purchase_token: purchaseInfo.purchaseToken || purchaseInfo.token || null,
        transaction_id: purchaseInfo.transactionId || purchaseInfo.id || null,
        purchase_time: purchaseInfo.purchaseTime || new Date().toISOString(),
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Purchase validated successfully",
        subscription: {
          tier: subscriptionTier,
          end: subscriptionEnd
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error validating purchase:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
