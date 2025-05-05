
import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.2?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Create Supabase admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Define admin email (hardcoded for security)
    const adminEmail = "deepflow.ia@gmail.com";

    // Check if user exists
    const { data: userData, error: userError } = await adminClient
      .from('auth.users')
      .select('id')
      .eq('email', adminEmail)
      .maybeSingle();

    if (userError) {
      throw new Error(`Error checking admin user: ${userError.message}`);
    }

    if (!userData || !userData.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Admin user not found" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404 
        }
      );
    }

    const userId = userData.id;

    // Check if the admin role already exists
    const { data: existingRoleData, error: roleCheckError } = await adminClient
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleCheckError) {
      throw new Error(`Error checking existing admin role: ${roleCheckError.message}`);
    }

    // If admin role doesn't exist, add it
    if (!existingRoleData) {
      const { error: insertRoleError } = await adminClient
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (insertRoleError) {
        throw new Error(`Error adding admin role: ${insertRoleError.message}`);
      }
    }

    // Check if creator role exists
    const { data: existingCreatorData, error: creatorCheckError } = await adminClient
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'creator')
      .maybeSingle();

    if (creatorCheckError) {
      throw new Error(`Error checking existing creator role: ${creatorCheckError.message}`);
    }

    // If creator role doesn't exist, add it
    if (!existingCreatorData) {
      const { error: insertCreatorError } = await adminClient
        .from('user_roles')
        .insert({ user_id: userId, role: 'creator' });

      if (insertCreatorError) {
        throw new Error(`Error adding creator role: ${insertCreatorError.message}`);
      }
    }

    // Ensure the user has an active subscription record
    const { data: subData, error: subError } = await adminClient
      .from('subscribers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (subError) {
      throw new Error(`Error checking subscription: ${subError.message}`);
    }

    if (!subData) {
      // Create subscription record for admin
      const { error: insertSubError } = await adminClient
        .from('subscribers')
        .insert({
          user_id: userId,
          email: adminEmail,
          subscribed: true,
          subscription_tier: 'Ultimate',
          subscription_end: new Date(2099, 11, 31).toISOString() // Far future date
        });

      if (insertSubError) {
        throw new Error(`Error creating subscription: ${insertSubError.message}`);
      }
    } else if (!subData.subscribed) {
      // Update subscription to be active if it exists but is inactive
      const { error: updateSubError } = await adminClient
        .from('subscribers')
        .update({
          subscribed: true,
          subscription_tier: 'Ultimate',
          subscription_end: new Date(2099, 11, 31).toISOString()
        })
        .eq('user_id', userId);

      if (updateSubError) {
        throw new Error(`Error updating subscription: ${updateSubError.message}`);
      }
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin account configured successfully"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
    
  } catch (error) {
    // Handle any errors that occurred during setup
    console.error("Error in setup-admin function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
