import { serve } from "https://deno.land/std@0.186.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This endpoint is disabled. Subscription management is handled exclusively
// through Stripe webhooks. Client-side purchase validation is not secure.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      error: "This endpoint is deprecated. Use Stripe for subscription management.",
    }),
    {
      status: 410, // Gone
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
