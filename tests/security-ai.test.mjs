import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// Exercise the real endpoint/auth/quota/refund code while isolating external services.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("https://esm.sh/@supabase/supabase-js@"))
      return {
        url: new URL("./support/supabase-mock.mjs", import.meta.url).href,
        shortCircuit: true,
      };
    return nextResolve(specifier, context);
  },
});
const env = new Map(
  Object.entries({
    SUPABASE_URL: "https://db.example",
    SUPABASE_ANON_KEY: "anon",
    SUPABASE_SERVICE_ROLE_KEY: "service",
    ALLOWED_ORIGINS: "https://app.example",
    GEMINI_API_KEY: "secret",
    GEMINI_MODEL: "gemini-test",
  }),
);
globalThis.Deno = { env: { get: (key) => env.get(key) } };
const { aiHandler } = await import("../supabase/functions/_shared/ai.ts");
const originalFetch = globalThis.fetch;
const user = { id: "alice", is_anonymous: false };
let state;

function reset() {
  state = { authError: null, user, calls: [], allow: true, providerCalls: 0 };
  globalThis.__supabaseMock = (_url, key, options) => ({
    auth: {
      getUser: async (token) => {
        state.calls.push([
          "auth",
          token,
          options.global?.headers.Authorization,
        ]);
        return { data: { user: state.user }, error: state.authError };
      },
    },
    from(table) {
      const query = {
        select() {
          return query;
        },
        eq(column, value) {
          state.calls.push(["filter", key, table, column, value]);
          return query;
        },
        order() {
          return query;
        },
        async limit() {
          return { data: [{ title: "Owned record" }], error: null };
        },
      };
      return query;
    },
    async rpc(name, args) {
      state.calls.push(["rpc", key, name, args]);
      if (name === "reserve_ai_credit")
        return {
          data: {
            allowed: state.allow,
            reservation_id: "reservation-1",
            remaining: state.allow ? 4 : 0,
          },
          error: null,
        };
      return { data: null, error: null };
    },
  });
  globalThis.fetch = async (_url, init) => {
    state.providerCalls++;
    state.providerBody = JSON.parse(init.body);
    return Response.json({
      candidates: [{ content: { parts: [{ text: "Helpful answer" }] } }],
    });
  };
}
function request(
  body,
  auth = "Bearer verified-token",
  origin = "https://app.example",
) {
  return new Request("https://db.example/functions/v1/gemini-chat", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(auth ? { authorization: auth } : {}),
      origin,
    },
    body: JSON.stringify(body),
  });
}
test.after(() => {
  globalThis.fetch = originalFetch;
});

for (const route of ["chat", "enhanced", "analysis"]) {
  test(`${route} rejects missing auth, expired sessions and body impersonation before provider/credit access`, async () => {
    reset();
    const body =
      route === "analysis" ? { prompt: "Help me" } : { message: "Help me" };
    assert.equal((await aiHandler(route)(request(body, ""))).status, 401);
    state.authError = new Error("expired");
    assert.equal((await aiHandler(route)(request(body))).status, 401);
    state.authError = null;
    assert.equal(
      (await aiHandler(route)(request({ ...body, user_id: "bob" }))).status,
      403,
    );
    assert.equal(state.providerCalls, 0);
    assert.equal(state.calls.filter((c) => c[0] === "rpc").length, 0);
  });
  test(`${route} shares the server quota and fails closed when exhausted`, async () => {
    reset();
    state.allow = false;
    const body =
      route === "analysis" ? { prompt: "Help me" } : { message: "Help me" };
    const response = await aiHandler(route)(request(body));
    assert.equal(response.status, 429);
    assert.equal((await response.json()).code, "AI_CREDITS_EXHAUSTED");
    assert.equal(state.providerCalls, 0);
    const reserve = state.calls.find((c) => c[2] === "reserve_ai_credit");
    assert.equal(reserve[1], "service");
    assert.equal(reserve[3].p_user_id, "alice");
  });
}

test("enhanced route loads only verified owner records, ignores forged client data and finalizes credit once", async () => {
  reset();
  const response = await aiHandler("enhanced")(
    request({
      message: "Help me",
      context: { user_data: { secret: "forged-client-context" } },
    }),
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).response, "Helpful answer");
  assert.equal(state.calls.filter((c) => c[0] === "filter").length, 4);
  assert.ok(
    state.calls
      .filter((c) => c[0] === "filter")
      .every((c) => c[1] === "anon" && c[3] === "user_id" && c[4] === "alice"),
  );
  assert.ok(
    !JSON.stringify(state.providerBody).includes("forged-client-context"),
  );
  assert.ok(
    !state.calls.some(
      (c) => c[2] === "journal_entries" || c[2] === "daily_reflections",
    ),
  );
  assert.deepEqual(
    state.calls.filter((c) => c[2] === "finish_ai_credit").map((c) => c[3]),
    [{ p_reservation_id: "reservation-1", p_succeeded: true }],
  );
});

test("journal and reflections are loaded only after explicit per-request inclusion", async () => {
  reset();
  assert.equal(
    (
      await aiHandler("enhanced")(
        request({ message: "Help me", context: { include_journal: true } }),
      )
    ).status,
    200,
  );
  assert.ok(state.calls.some((c) => c[2] === "journal_entries"));
  assert.ok(state.calls.some((c) => c[2] === "daily_reflections"));
});

test("provider rejection and transport errors trigger one failure refund", async () => {
  for (const failure of [
    async () => new Response("provider diagnostics", { status: 429 }),
    async () => {
      throw new Error("network down");
    },
    async () => new Response("{invalid"),
    async () => Response.json({ candidates: [] }),
    async () => new Response("x".repeat(512 * 1024 + 1)),
  ]) {
    reset();
    globalThis.fetch = failure;
    const response = await aiHandler("chat")(request({ message: "Help me" }));
    assert.ok(response.status >= 500);
    assert.ok(!(await response.text()).includes("provider diagnostics"));
    assert.deepEqual(
      state.calls.filter((c) => c[2] === "finish_ai_credit").map((c) => c[3]),
      [{ p_reservation_id: "reservation-1", p_succeeded: false }],
    );
  }
});

test("disallowed origins and non-POST requests cannot reach authentication", async () => {
  reset();
  assert.equal(
    (
      await aiHandler("chat")(
        request({ message: "Hi" }, "Bearer token", "https://evil.example"),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await aiHandler("chat")(
        new Request("https://db.example", {
          headers: { origin: "https://app.example" },
        }),
      )
    ).status,
    405,
  );
  assert.equal(state.calls.length, 0);
});
