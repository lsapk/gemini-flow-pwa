// DeepFlow Public API v1 router.
// Authenticates Bearer access_token, checks scopes, dispatches to handlers,
// scopes every query to the token's user_id.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errResp(code: string, message: string, status: number, extra: Record<string, unknown> = {}) {
  return json({ error: { code, message, ...extra } }, status);
}

// resource -> { table, requiredScopeDomain, writableFields, listOrderColumn }
const RESOURCES: Record<
  string,
  {
    table: string;
    domain: string;
    writable: string[] | null; // null = read-only
    orderColumn?: string;
  }
> = {
  tasks: {
    table: "tasks",
    domain: "tasks",
    writable: ["title", "description", "completed", "priority", "due_date", "category", "sort_order"],
    orderColumn: "created_at",
  },
  habits: {
    table: "habits",
    domain: "habits",
    writable: ["title", "description", "frequency", "target", "category", "days_of_week", "is_archived", "linked_goal_id"],
    orderColumn: "created_at",
  },
  "habit-completions": {
    table: "habit_completions",
    domain: "habits",
    writable: ["habit_id", "completed_date"],
    orderColumn: "completed_date",
  },
  goals: {
    table: "goals",
    domain: "goals",
    writable: ["title", "description", "progress", "category", "completed", "target_date", "is_archived"],
    orderColumn: "created_at",
  },
  "focus-sessions": {
    table: "focus_sessions",
    domain: "focus",
    writable: ["title", "duration", "started_at", "completed_at"],
    orderColumn: "started_at",
  },
  "background-focus-sessions": {
    table: "background_focus_sessions",
    domain: "focus",
    writable: ["started_at", "ended_at", "duration_minutes", "is_active"],
    orderColumn: "started_at",
  },
  journal: {
    table: "journal_entries",
    domain: "journal",
    writable: ["title", "content", "mood", "tags"],
    orderColumn: "created_at",
  },
  reflections: {
    table: "daily_reflections",
    domain: "reflection",
    writable: ["question", "answer"],
    orderColumn: "created_at",
  },
  lessons: {
    table: "lessons",
    domain: "lessons",
    writable: ["title", "content", "type", "difficulty", "data", "subject_id"],
    orderColumn: "created_at",
  },
  "good-actions": {
    table: "good_actions",
    domain: "community",
    writable: ["title", "description", "category", "is_public"],
    orderColumn: "created_at",
  },
  insights: {
    table: "ai_productivity_insights",
    domain: "analytics",
    writable: null,
    orderColumn: "updated_at",
  },
  analysis: {
    table: "ai_productivity_analysis",
    domain: "analytics",
    writable: null,
    orderColumn: "updated_at",
  },
  "personality-profile": {
    table: "ai_personality_profiles",
    domain: "analytics",
    writable: null,
    orderColumn: "updated_at",
  },
  "ai-credits": {
    table: "ai_credits",
    domain: "profile",
    writable: null,
    orderColumn: "last_updated",
  },
  "daily-usage": {
    table: "daily_usage",
    domain: "analytics",
    writable: null,
    orderColumn: "usage_date",
  },
};

const PROFILE_RES = {
  table: "user_profiles",
  domain: "profile",
  writable: ["display_name", "bio", "avatar_url"],
};
const SETTINGS_RES = {
  table: "user_settings",
  domain: "settings",
  writable: null as null,
};

function pickWritable(payload: Record<string, unknown>, allowed: string[]) {
  const out: Record<string, unknown> = {};
  for (const k of allowed) if (k in payload) out[k] = payload[k];
  return out;
}

async function logRequest(
  admin: SupabaseClient,
  clientId: string,
  userId: string,
  endpoint: string,
  method: string,
  status: number,
  durationMs: number,
) {
  try {
    await admin.from("api_request_logs").insert({
      client_id: clientId,
      user_id: userId,
      endpoint,
      method,
      status_code: status,
      duration_ms: durationMs,
    });
  } catch (e) {
    console.error("log insert failed", e);
  }
}

Deno.serve(async (req) => {
  const started = Date.now();
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  // Path looks like /api-v1-router/v1/tasks/123
  const segments = url.pathname.split("/").filter(Boolean);
  const v1Idx = segments.indexOf("v1");
  if (v1Idx === -1) {
    return errResp("not_found", "Use /v1/<resource>", 404);
  }
  const after = segments.slice(v1Idx + 1);
  const resource = after[0];
  const itemId = after[1];

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errResp("invalid_token", "Missing Bearer token", 401);
  }
  const accessToken = authHeader.replace("Bearer ", "").trim();
  const accessHash = await sha256Hex(accessToken);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: tok } = await admin
    .from("oauth_tokens")
    .select("*")
    .eq("access_token_hash", accessHash)
    .maybeSingle();

  if (!tok || tok.revoked_at || new Date(tok.expires_at).getTime() < Date.now()) {
    return errResp("invalid_token", "Token invalid or expired", 401);
  }
  const userId = tok.user_id as string;
  const clientId = tok.client_id as string;
  const scopes = (tok.scopes as string[]) ?? [];

  // touch last_used
  admin.from("oauth_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", tok.id).then(() => {});

  // Helper to dispatch + log
  const finish = async (resp: Response) => {
    await logRequest(admin, clientId, userId, url.pathname, req.method, resp.status, Date.now() - started);
    return resp;
  };

  try {
    // /v1/me
    if (resource === "me" && !itemId) {
      if (!scopes.includes("profile:read")) {
        return finish(errResp("insufficient_scope", "profile:read required", 403, { required_scope: "profile:read" }));
      }
      const { data } = await admin
        .from("user_profiles")
        .select("id, display_name, email, bio, avatar_url, created_at")
        .eq("id", userId)
        .maybeSingle();
      return finish(json({ data }));
    }

    // /v1/settings
    if (resource === "settings" && !itemId) {
      if (!scopes.includes("settings:read")) {
        return finish(errResp("insufficient_scope", "settings:read required", 403, { required_scope: "settings:read" }));
      }
      const { data } = await admin
        .from("user_settings")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      return finish(json({ data }));
    }

    // /v1/export
    if (resource === "export" && !itemId && req.method === "GET") {
      if (!scopes.includes("data:export")) {
        return finish(errResp("insufficient_scope", "data:export required", 403, { required_scope: "data:export" }));
      }
      const tables = ["tasks", "habits", "habit_completions", "goals", "focus_sessions", "journal_entries", "daily_reflections", "good_actions"];
      const out: Record<string, unknown> = {};
      for (const t of tables) {
        const { data } = await admin.from(t).select("*").eq("user_id", userId);
        out[t] = data ?? [];
      }
      return finish(json({ data: out }));
    }

    const def = RESOURCES[resource];
    if (!def) {
      return finish(errResp("not_found", `Unknown resource: ${resource}`, 404));
    }

    const readScope = `${def.domain}:read`;
    const writeScope = `${def.domain}:write`;

    // ----- GET list / detail -----
    if (req.method === "GET") {
      if (!scopes.includes(readScope) && !scopes.includes(writeScope)) {
        return finish(errResp("insufficient_scope", `${readScope} required`, 403, { required_scope: readScope }));
      }
      if (itemId) {
        const { data, error } = await admin
          .from(def.table)
          .select("*")
          .eq("user_id", userId)
          .eq("id", itemId)
          .maybeSingle();
        if (error) return finish(errResp("internal_error", error.message, 500));
        if (!data) return finish(errResp("not_found", "Not found", 404));
        return finish(json({ data }));
      }
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
      const cursor = url.searchParams.get("cursor");
      let q = admin.from(def.table).select("*").eq("user_id", userId);
      if (def.orderColumn) q = q.order(def.orderColumn, { ascending: false });
      if (cursor) q = q.lt(def.orderColumn ?? "created_at", cursor);
      q = q.limit(limit);
      const { data, error } = await q;
      if (error) return finish(errResp("internal_error", error.message, 500));
      const list = data ?? [];
      const nextCursor =
        list.length === limit && def.orderColumn
          ? (list[list.length - 1] as Record<string, unknown>)[def.orderColumn]
          : null;
      return finish(json({ data: list, meta: { count: list.length, next_cursor: nextCursor } }));
    }

    // ----- Writes -----
    if (req.method === "POST" || req.method === "PATCH" || req.method === "DELETE") {
      // /v1/me PATCH -> profile write
      if (resource === "me" && req.method === "PATCH") {
        if (!scopes.includes("profile:write")) {
          return finish(errResp("insufficient_scope", "profile:write required", 403, { required_scope: "profile:write" }));
        }
        const body = await req.json();
        const payload = pickWritable(body, PROFILE_RES.writable);
        const { data, error } = await admin
          .from("user_profiles")
          .update(payload)
          .eq("id", userId)
          .select()
          .maybeSingle();
        if (error) return finish(errResp("validation_error", error.message, 422));
        return finish(json({ data }));
      }

      if (def.writable === null) {
        return finish(errResp("forbidden", "Resource is read-only", 403));
      }
      if (!scopes.includes(writeScope)) {
        return finish(errResp("insufficient_scope", `${writeScope} required`, 403, { required_scope: writeScope }));
      }

      if (req.method === "POST") {
        const body = await req.json();
        const payload = pickWritable(body, def.writable);
        const { data, error } = await admin
          .from(def.table)
          .insert({ ...payload, user_id: userId })
          .select()
          .maybeSingle();
        if (error) return finish(errResp("validation_error", error.message, 422));
        return finish(json({ data }, 201));
      }

      if (!itemId) {
        return finish(errResp("invalid_request", "Item id required", 400));
      }

      if (req.method === "PATCH") {
        const body = await req.json();
        const payload = pickWritable(body, def.writable);
        const { data, error } = await admin
          .from(def.table)
          .update(payload)
          .eq("user_id", userId)
          .eq("id", itemId)
          .select()
          .maybeSingle();
        if (error) return finish(errResp("validation_error", error.message, 422));
        if (!data) return finish(errResp("not_found", "Not found", 404));
        return finish(json({ data }));
      }

      if (req.method === "DELETE") {
        const { error } = await admin
          .from(def.table)
          .delete()
          .eq("user_id", userId)
          .eq("id", itemId);
        if (error) return finish(errResp("internal_error", error.message, 500));
        return finish(json({ data: { id: itemId, deleted: true } }));
      }
    }

    return finish(errResp("method_not_allowed", "Method not allowed", 405));
  } catch (e) {
    console.error("api-v1-router error", e);
    return finish(errResp("server_error", String(e), 500));
  }
});
