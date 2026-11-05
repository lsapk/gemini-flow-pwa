import { endpoint, json } from "../_shared/http.ts";
// Administrator provisioning belongs in an audited database operation.
Deno.serve(endpoint(async (req) => json(req, { error: "Administrator bootstrap is disabled" }, 410)));
