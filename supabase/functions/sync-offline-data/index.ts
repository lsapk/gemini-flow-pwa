import { assertIdentity, authenticate, endpoint, HttpError, json, jsonBody, object, text } from "../_shared/http.ts";
Deno.serve(endpoint(async (req) => {
  const { user, client } = await authenticate(req);
  const body = await jsonBody(req, 256 * 1024);
  assertIdentity(body, user.id);
  const args: Record<string, unknown> = { p_user_id: user.id };
  for (const key of ["tasks", "habits", "goals", "journal", "focus"]) {
    const values = body[key] ?? [];
    if (!Array.isArray(values) || values.length > 100) throw new HttpError(400, `Invalid ${key}`);
    for (const value of values) {
      const item = object(value, "sync item");
      assertIdentity(item, user.id);
      text(item.offline_id, "offline_id", 200);
    }
    args[`p_${key}`] = values;
  }
  // Preserve user RLS all the way to each write.
  const { data, error } = await client.rpc("batch_sync_offline_data", args);
  if (error) throw new HttpError(400, "Unable to sync supplied records");
  return json(req, data);
}));
