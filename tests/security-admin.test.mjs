import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    return specifier.startsWith("https://esm.sh/@supabase/supabase-js@")
      ? {
          url: new URL("./support/supabase-mock.mjs", import.meta.url).href,
          shortCircuit: true,
        }
      : nextResolve(specifier, context);
  },
});

const env = {
  SUPABASE_URL: "https://db.example",
  SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service",
};
let handler;
globalThis.Deno = {
  env: { get: (name) => env[name] },
  serve: (fn) => {
    handler = fn;
  },
};
await import("../supabase/functions/verify-admin/index.ts");

const request = (role, offset = 0) =>
  new Request("https://db.example/verify-admin", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + role,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "directory", offset, user_id: "ignored" }),
  });

test("administrator directory rejects unverified roles before using the service key", async () => {
  globalThis.__supabaseMock = (_url, key) => {
    assert.equal(key, "anon");
    const query = {
      select: () => query,
      eq: () => query,
      maybeSingle: async () => ({ data: null, error: null }),
    };
    return {
      auth: { getUser: async () => ({ data: { user: { id: "viewer" } } }) },
      from: () => query,
    };
  };
  const response = await handler(request("viewer"));
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    error: "Administrator access required",
  });
});

test("directory returns only approved account metadata after role verification", async () => {
  const profile = {
    id: "student",
    email: "student@example.test",
    display_name: "Camille",
    created_at: "2026-11-05",
    bio: "Private text",
  };
  globalThis.__supabaseMock = (_url, key) => {
    const from = (table) => {
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        maybeSingle: async () => ({ data: { role: "admin" }, error: null }),
        range: async (start, end) => {
          assert.equal(key, "service");
          assert.deepEqual([start, end], [500, 999]);
          return { data: [profile], error: null };
        },
        in: async (_field, ids) => {
          assert.deepEqual(ids, [profile.id]);
          return {
            data: table === "banned_users" ? [{ user_id: profile.id }] : [],
            error: null,
          };
        },
      };
      return query;
    };
    return {
      auth: {
        getUser: async () => ({ data: { user: { id: "verified-admin" } } }),
      },
      from,
    };
  };
  const response = await handler(request("verified-admin", 500));
  assert.equal(response.status, 200);
  const { bio: _private, ...publicFields } = profile;
  assert.deepEqual(await response.json(), {
    profiles: [{ ...publicFields, admin: false, restricted: true }],
  });
});
