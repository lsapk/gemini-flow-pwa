import { endpoint, json, jsonBody, text, HttpError } from "../_shared/http.ts";
Deno.serve(endpoint(async (req) => {
  const body = await jsonBody(req, 16 * 1024);
  text(body.name, "name", 120);
  const email = text(body.email, "email", 254);
  text(body.message, "message", 8000);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Invalid email");
  // Never log private messages or claim delivery until a provider exists.
  return json(req, { success: false, error: "Contact delivery is not configured" }, 503);
}));
