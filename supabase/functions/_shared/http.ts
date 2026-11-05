import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0?target=deno";
import { allowedOrigin, HttpError } from "./validation.ts";
export { HttpError, assertIdentity, jsonBody, object, text } from "./validation.ts";

export function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new HttpError(503, "Service is not configured");
  return value;
}

export function corsHeaders(req: Request): Headers {
  const headers = new Headers({
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  const origin = req.headers.get("origin");
  if (origin && allowedOrigin(origin, Deno.env.get("ALLOWED_ORIGINS") ?? "")) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

export function json(req: Request, body: unknown, status = 200): Response {
  const headers = corsHeaders(req);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers });
}

export function endpoint(handler: (req: Request) => Promise<Response>): (req: Request) => Promise<Response> {
  return async (req) => {
    try {
      if (!allowedOrigin(req.headers.get("origin"), Deno.env.get("ALLOWED_ORIGINS") ?? "")) throw new HttpError(403, "Origin not allowed");
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
      if (req.method !== "POST") throw new HttpError(405, "Method not allowed");
      return await handler(req);
    } catch (error) {
      const known = error instanceof HttpError;
      if (!known) console.error("Edge function failed", error instanceof Error ? error.name : "UnknownError");
      return json(req, { error: known ? error.message : "Service temporarily unavailable" }, known ? error.status : 503);
    }
  };
}

export function serviceClient() {
  return createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function authenticate(req: Request) {
  const match = /^Bearer ([^\s]+)$/i.exec(req.headers.get("Authorization") ?? "");
  if (!match) throw new HttpError(401, "Authentication required");
  const client = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_ANON_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${match[1]}` } },
  });
  const { data, error } = await client.auth.getUser(match[1]);
  if (error || !data.user || data.user.is_anonymous) throw new HttpError(401, "Valid user session required");
  return { user: data.user, client };
}

export function appUrl(): string {
  const url = new URL(requiredEnv("APP_URL"));
  if ((url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new HttpError(503, "Service is not configured");
  return url.origin;
}
