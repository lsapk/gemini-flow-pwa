// Exchanges an authorization code (or refresh token) for access tokens.
// Public endpoint. Validates client_secret + PKCE.
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

async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const ACCESS_TTL_SEC = 60 * 60; // 1h
const REFRESH_TTL_SEC = 60 * 60 * 24 * 30; // 30d

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { grant_type, client_id, client_secret } = body ?? {};

    if (typeof client_id !== "string" || typeof client_secret !== "string") {
      return new Response(JSON.stringify({ error: "invalid_request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: app } = await admin
      .from("oauth_apps")
      .select("client_id, client_secret_hash, redirect_uris")
      .eq("client_id", client_id)
      .maybeSingle();

    const secretHash = await sha256Hex(client_secret);
    if (!app || app.client_secret_hash !== secretHash) {
      return new Response(JSON.stringify({ error: "invalid_client" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (grant_type === "authorization_code") {
      const { code, code_verifier, redirect_uri } = body ?? {};
      if (
        typeof code !== "string" ||
        typeof code_verifier !== "string" ||
        typeof redirect_uri !== "string"
      ) {
        return new Response(JSON.stringify({ error: "invalid_request" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const codeHash = await sha256Hex(code);
      const { data: auth } = await admin
        .from("oauth_authorizations")
        .select("*")
        .eq("code_hash", codeHash)
        .maybeSingle();

      if (
        !auth ||
        auth.used ||
        auth.client_id !== client_id ||
        auth.redirect_uri !== redirect_uri ||
        new Date(auth.expires_at).getTime() < Date.now()
      ) {
        return new Response(JSON.stringify({ error: "invalid_grant" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // PKCE check
      const expected = await sha256Base64Url(code_verifier);
      if (expected !== auth.pkce_challenge) {
        return new Response(JSON.stringify({ error: "invalid_grant" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await admin
        .from("oauth_authorizations")
        .update({ used: true })
        .eq("id", auth.id);

      const accessToken = randomToken(32);
      const refreshToken = randomToken(32);
      const accessHash = await sha256Hex(accessToken);
      const refreshHash = await sha256Hex(refreshToken);
      const expiresAt = new Date(Date.now() + ACCESS_TTL_SEC * 1000);

      await admin.from("oauth_tokens").insert({
        access_token_hash: accessHash,
        refresh_token_hash: refreshHash,
        client_id,
        user_id: auth.user_id,
        scopes: auth.scopes,
        expires_at: expiresAt.toISOString(),
      });

      return new Response(
        JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: "Bearer",
          expires_in: ACCESS_TTL_SEC,
          scope: (auth.scopes as string[]).join(" "),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (grant_type === "refresh_token") {
      const { refresh_token } = body ?? {};
      if (typeof refresh_token !== "string") {
        return new Response(JSON.stringify({ error: "invalid_request" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const refreshHash = await sha256Hex(refresh_token);
      const { data: tok } = await admin
        .from("oauth_tokens")
        .select("*")
        .eq("refresh_token_hash", refreshHash)
        .maybeSingle();

      if (
        !tok ||
        tok.client_id !== client_id ||
        tok.revoked_at !== null
      ) {
        return new Response(JSON.stringify({ error: "invalid_grant" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Rotate
      const newAccess = randomToken(32);
      const newRefresh = randomToken(32);
      const newAccessHash = await sha256Hex(newAccess);
      const newRefreshHash = await sha256Hex(newRefresh);
      const expiresAt = new Date(Date.now() + ACCESS_TTL_SEC * 1000);

      // Revoke old, insert new
      await admin
        .from("oauth_tokens")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", tok.id);

      await admin.from("oauth_tokens").insert({
        access_token_hash: newAccessHash,
        refresh_token_hash: newRefreshHash,
        client_id,
        user_id: tok.user_id,
        scopes: tok.scopes,
        expires_at: expiresAt.toISOString(),
      });

      return new Response(
        JSON.stringify({
          access_token: newAccess,
          refresh_token: newRefresh,
          token_type: "Bearer",
          expires_in: ACCESS_TTL_SEC,
          scope: (tok.scopes as string[]).join(" "),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ error: "unsupported_grant_type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("oauth-token error", e);
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
