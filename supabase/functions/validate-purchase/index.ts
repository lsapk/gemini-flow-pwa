import { authenticate, endpoint, json } from "../_shared/http.ts";
Deno.serve(endpoint(async (req) => {
  await authenticate(req);
  // Client receipts are not payment proof. Require store validation, account binding and replay protection before enabling.
  return json(req, { success: false, error: "Mobile purchase verification is not configured" }, 503);
}));
