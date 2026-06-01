// Creates an authorization code after the user consents to an OAuth app.
// Called from /oauth/consent in DeepFlow (user must be logged in).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function randomToken(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(
      token,
    );
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const body = await req.json();
    const {
      client_id,
      redirect_uri,
      scopes,
      code_challenge,
      code_challenge_method,
    } = body ?? {};

    if (
      typeof client_id !== "string" ||
      typeof redirect_uri !== "string" ||
      !Array.isArray(scopes) ||
      typeof code_challenge !== "string" ||
      code_challenge_method !== "S256"
    ) {
      return new Response(
        JSON.stringify({ error: "invalid_request" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: app } = await admin
      .from("oauth_apps")
      .select("client_id, redirect_uris")
      .eq("client_id", client_id)
      .maybeSingle();

    if (!app || !app.redirect_uris.includes(redirect_uri)) {
      return new Response(
        JSON.stringify({ error: "invalid_client_or_redirect" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const code = randomToken(32);
    const codeHash = await sha256Hex(code);

    const { error: insertErr } = await admin
      .from("oauth_authorizations")
      .insert({
        code_hash: codeHash,
        client_id,
        user_id: userId,
        redirect_uri,
        scopes,
        pkce_challenge: code_challenge,
        pkce_method: "S256",
      });
    if (insertErr) throw insertErr;

    // Upsert consent
    await admin.from("oauth_user_consents").upsert(
      {
        user_id: userId,
        client_id,
        scopes,
        granted_at: new Date().toISOString(),
        revoked_at: null,
      },
      { onConflict: "user_id,client_id" },
    );

    return new Response(JSON.stringify({ code }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("oauth-authorize error", e);
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
