import {
  authenticate,
  endpoint,
  HttpError,
  json,
  jsonBody,
  serviceClient,
} from "../_shared/http.ts";

Deno.serve(
  endpoint(async (req) => {
    const { user, client } = await authenticate(req);
    const { data, error } = await client
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (error) throw new HttpError(503, "Unable to verify administrator role");
    const body = req.body ? await jsonBody(req, 2048) : {};
    if (body.action === undefined || body.action === "verify") {
      return json(req, { isAdmin: Boolean(data), userId: user.id });
    }
    if (body.action !== "directory") throw new HttpError(400, "Invalid action");
    if (!data) throw new HttpError(403, "Administrator access required");
    const offset = body.offset;
    if (
      typeof offset !== "number" ||
      !Number.isInteger(offset) ||
      offset < 0 ||
      offset > 100_000
    ) {
      throw new HttpError(400, "Invalid directory page");
    }

    // Only a verified administrator can reach this bounded, read-only lookup.
    const service = serviceClient();
    const profiles = await service
      .from("user_profiles")
      .select("id,email,display_name,created_at")
      .order("id")
      .range(offset, offset + 499);
    if (profiles.error)
      throw new HttpError(503, "Unable to load administrator directory");
    if (!profiles.data.length) return json(req, { profiles: [] });
    const ids = profiles.data.map((profile) => profile.id);
    const admins = new Set<string>();
    const restricted = new Set<string>();
    for (let start = 0; start < ids.length; start += 100) {
      const batch = ids.slice(start, start + 100);
      const [roles, restrictions] = await Promise.all([
        service
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin")
          .in("user_id", batch),
        service.from("banned_users").select("user_id").in("user_id", batch),
      ]);
      if (roles.error || restrictions.error)
        throw new HttpError(503, "Unable to load administrator directory");
      roles.data.forEach((row) => admins.add(row.user_id));
      restrictions.data.forEach((row) => restricted.add(row.user_id));
    }
    return json(req, {
      profiles: profiles.data.map((profile) => ({
        id: profile.id,
        email: profile.email,
        display_name: profile.display_name,
        created_at: profile.created_at,
        admin: admins.has(profile.id),
        restricted: restricted.has(profile.id),
      })),
    });
  }),
);
