import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("https://esm.sh/@supabase/supabase-js@")) return { url: new URL("./support/supabase-mock.mjs", import.meta.url).href, shortCircuit: true };
  return nextResolve(specifier, context);
}});
const env = new Map(Object.entries({ SUPABASE_URL: "https://db.example", SUPABASE_ANON_KEY: "anon", SUPABASE_SERVICE_ROLE_KEY: "service", ALLOWED_ORIGINS: "https://app.example", ICS_ALLOWED_HOSTS: "ade.university.fr", GEMINI_MODEL: "gemini-test", GEMINI_API_KEY: "key" }));
globalThis.Deno = { env: { get: key => env.get(key) } };
const { calendarFeedUrl, icalHandler } = await import("../supabase/functions/_shared/ical.ts");
const { itemAssistantHandler, itemSuggestion } = await import("../supabase/functions/_shared/item-assistant.ts");
const { retiredHandler } = await import("../supabase/functions/_shared/retired.ts");
const originalFetch = globalThis.fetch;
let calls = [];
let user = { id: "alice", is_anonymous: false };
globalThis.__supabaseMock = () => ({ auth: { getUser: async () => ({ data: { user }, error: null }) }, rpc: async (name, args) => { calls.push([name, args]); return { data: name === "reserve_ai_credit" ? { allowed: true, reservation_id: "r1", remaining: 4 } : null, error: null }; } });
const request = (body, token = true) => new Request("https://db.example/functions/v1/test", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://app.example", ...(token ? { Authorization: "Bearer user-token", Cookie: "must-not-forward=secret" } : {}) }, body: JSON.stringify(body) });
test.beforeEach(() => { calls = []; user = { id: "alice", is_anonymous: false }; env.set("ICS_ALLOWED_HOSTS", "ade.university.fr"); });
test.after(() => { globalThis.fetch = originalFetch; });

test("calendar URL requires exact configured HTTPS university host and rejects credentials/IP/ports", () => {
  assert.equal(calendarFeedUrl("https://ade.university.fr/calendar?private=secret", "ade.university.fr").hostname, "ade.university.fr");
  for (const value of ["http://ade.university.fr/feed", "https://ade.university.fr.evil.test/feed", "https://user:password@ade.university.fr/feed", "https://127.0.0.1/feed", "https://[::1]/feed", "https://ade.university.fr:8443/feed", "https://ade.university.fr/feed#fragment"]) assert.throws(() => calendarFeedUrl(value, "ade.university.fr"));
  assert.throws(() => calendarFeedUrl("https://ade.university.fr/feed", undefined), { status: 503 });
  assert.throws(() => calendarFeedUrl("https://ade.university.fr/feed", "*.university.fr"), { status: 503 });
});
test("calendar fetch authenticates first and forwards no user credentials or redirects", async () => {
  let requests = 0;
  globalThis.fetch = async (url, init) => { requests++; assert.equal(new URL(url).hostname, "ade.university.fr"); assert.equal(init.redirect, "error"); assert.equal(init.headers.Authorization, undefined); assert.equal(init.headers.Cookie, undefined); return new Response("BEGIN:VCALENDAR\r\nEND:VCALENDAR"); };
  assert.equal((await icalHandler(request({ url: "https://ade.university.fr/feed" }, false))).status, 401);
  assert.equal(requests, 0);
  const result = await icalHandler(request({ url: "https://ade.university.fr/feed" }));
  assert.equal(result.status, 200); assert.match((await result.json()).content, /^BEGIN:VCALENDAR/);
});
test("calendar stream is bounded even without Content-Length and refuses redirect/network failures", async () => {
  globalThis.fetch = async () => new Response("BEGIN:VCALENDAR\n" + "x".repeat(2 * 1024 * 1024));
  assert.equal((await icalHandler(request({ url: "https://ade.university.fr/feed" }))).status, 413);
  globalThis.fetch = async () => { throw new TypeError("redirect to private target"); };
  const response = await icalHandler(request({ url: "https://ade.university.fr/feed?token=secret" }));
  assert.equal(response.status, 502); assert.doesNotMatch(await response.text(), /token=secret|private target/);
});
test("item suggestions have bounded validated fields and strip unrequested actions", () => {
  const result = itemSuggestion(JSON.stringify({ description: "Étudier le chapitre.", priority: "high", subtasks: ["Lire le cours"], execute: "delete_all" }), "task");
  assert.deepEqual(result, { suggestion: { description: "Étudier le chapitre.", priority: "high", subtasks: ["Lire le cours"] } });
  assert.throws(() => itemSuggestion('{"description":"x","priority":"root","subtasks":[]}', "task"));
});
test("item assistant shares authenticated quota and refunds malformed provider output", async () => {
  let requests = 0;
  globalThis.fetch = async () => { requests++; return Response.json({ candidates: [{ content: { parts: [{ text: "not JSON" }] } }] }); };
  assert.equal((await itemAssistantHandler(request({ type: "task", title: "Cours", user_id: "bob" }))).status, 403);
  assert.equal(requests, 0);
  const response = await itemAssistantHandler(request({ type: "task", title: "Cours" }));
  assert.equal(response.status, 502);
  assert.equal(requests, 1);
  assert.ok(calls.some(([name, args]) => name === "reserve_ai_credit" && args.p_user_id === "alice"));
  assert.ok(calls.some(([name, args]) => name === "finish_ai_credit" && args.p_succeeded === false));
  assert.ok(!calls.some(([name, args]) => name === "finish_ai_credit" && args.p_succeeded === true));
});
test("legacy endpoint retirement cannot spend provider funds or accept invalid sessions", async () => {
  globalThis.fetch = async () => { throw new Error("must not call provider"); };
  const handler = retiredHandler("Use the assistant");
  assert.equal((await handler(request({}, false))).status, 401);
  assert.equal((await handler(request({}))).status, 410);
  assert.equal(calls.length, 0);
});
