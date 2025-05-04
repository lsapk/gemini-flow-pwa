
import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.2?target=deno";

// Define CORS headers
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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // Create Supabase client for authentication
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Authenticate the user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      throw new Error("Authentication failed: " + userError.message);
    }

    const user = userData.user;
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Extract data to sync from the request
    const { tasks = [], habits = [], goals = [], journal = [], focus = [] } = await req.json();
    
    // Create admin Supabase client for database operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Call the batch sync function
    const { data, error } = await adminClient.rpc('batch_sync_offline_data', {
      p_user_id: user.id,
      p_tasks: tasks.length > 0 ? tasks : null,
      p_habits: habits.length > 0 ? habits : null,
      p_goals: goals.length > 0 ? goals : null,
      p_journal: journal.length > 0 ? journal : null,
      p_focus: focus.length > 0 ? focus : null
    });

    if (error) {
      throw new Error(`Batch sync failed: ${error.message}`);
    }

    // Return the sync result
    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
    
  } catch (error) {
    // Handle any errors that occurred during the sync
    console.error("Error in sync function:", error);
    
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
