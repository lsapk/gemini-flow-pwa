import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  decrypt,
  encrypt,
  GOOGLE_SCOPES,
  randomSecret,
  sha256,
  taskMarker,
} from "../supabase/functions/_shared/google-domain.ts";

// Execute the real Edge handlers and storage RPC against PostgreSQL, replacing
// only the Auth/provider network boundaries. No remote account or data is touched.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("npm:@supabase/supabase-js@"))
      return {
        url: new URL("./support/supabase-mock.mjs", import.meta.url).href,
        shortCircuit: true,
      };
    return nextResolve(specifier, context);
  },
});

const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";
const app = "https://app.example";
const server = "https://db.example";
const encryptionKey = randomSecret();
const env = new Map(
  Object.entries({
    APP_URL: app,
    SUPABASE_URL: server,
    SUPABASE_SERVICE_ROLE_KEY: "server-only-service",
    GOOGLE_CLIENT_ID: "oauth-client",
    GOOGLE_CLIENT_SECRET: "server-only-client-secret",
    GOOGLE_TOKEN_ENCRYPTION_KEY: encryptionKey,
  }),
);
const handlers = [];
globalThis.Deno = {
  env: { get: (name) => env.get(name) },
  serve: (handler) => handlers.push(handler),
};
await import("../supabase/functions/google-oauth/index.ts");
await import("../supabase/functions/google-api/index.ts");
const [oauth, api] = handlers;
const { retiredGoogleOAuth } =
  await import("../supabase/functions/_shared/google-retired.ts");

const db = new PGlite();
await db.exec(`
  create role anon; create role authenticated; create role service_role bypassrls;
  create schema auth;
  create table auth.users(id uuid primary key,email text);
  insert into auth.users values ('${alice}','alice@deepflow.example'),('${bob}','bob@deepflow.example');
  create table public.tasks(id uuid primary key default gen_random_uuid(),user_id uuid not null,title text not null,description text,due_date timestamptz,completed boolean not null default false,priority text,updated_at timestamptz default now());
`);
await db.exec(
  await readFile(
    new URL(
      "../supabase/migrations/20261103202446_google_connections.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
const originalFetch = globalThis.fetch;
let state;

function rpc(action, user, payload = {}) {
  return db
    .query("select public.google_store($1,$2,$3::jsonb) data", [
      action,
      user,
      JSON.stringify(payload),
    ])
    .then((result) => result.rows[0].data);
}

async function reset() {
  await db.exec(
    "truncate google_private.operation_locks,google_private.oauth_states,google_private.pending_connections,google_private.connections,google_private.task_mappings,public.tasks cascade",
  );
  state = {
    providerCalls: [],
    rpcCalls: [],
    remote: new Map(),
    nextId: 1,
    tokenExchanges: 0,
    refreshes: 0,
    posts: 0,
    patches: 0,
    scopes: [...GOOGLE_SCOPES],
    authAnonymous: false,
    authExpired: false,
    failMap: false,
    providerError: null,
    revokeError: false,
    challenge: null,
    calendar: new Map([
      [
        "event-one",
        {
          id: "event-one",
          summary: "Réunion",
          description: "Notes",
          etag: '"v1"',
          start: { dateTime: "2026-11-04T10:00:00+01:00" },
          end: { dateTime: "2026-11-04T11:00:00+01:00" },
          htmlLink: "https://calendar.google.com/calendar/event?eid=one",
        },
      ],
      [
        "event-two",
        {
          id: "event-two",
          summary: "Journée",
          etag: '"v2"',
          start: { date: "2026-11-05" },
          end: { date: "2026-11-06" },
          htmlLink: "javascript:alert(1)",
        },
      ],
      ["event-cancelled", { id: "event-cancelled", status: "cancelled" }],
    ]),
  };
  globalThis.__supabaseMock = (_url, key) => {
    assert.equal(key, "server-only-service");
    return {
      auth: {
        getUser: async (token) => ({
          data: {
            user:
              !state.authExpired && ["alice-jwt", "bob-jwt"].includes(token)
                ? {
                    id: token === "alice-jwt" ? alice : bob,
                    is_anonymous: state.authAnonymous,
                  }
                : null,
          },
          error: null,
        }),
      },
      async rpc(name, args) {
        assert.equal(name, "google_store");
        state.rpcCalls.push(args);
        if (state.failMap && args.p_action === "map_save") {
          state.failMap = false;
          return {
            data: null,
            error: new Error("DB response interrupted after Google create"),
          };
        }
        try {
          return {
            data: await rpc(args.p_action, args.p_user_id, args.p_payload),
            error: null,
          };
        } catch (error) {
          return { data: null, error };
        }
      },
      from(table) {
        assert.equal(table, "tasks");
        let owner;
        const query = {
          select() {
            return query;
          },
          eq(column, value) {
            assert.equal(column, "user_id");
            owner = value;
            return query;
          },
          order(column) {
            assert.equal(column, "id");
            return query;
          },
          async range(start, end) {
            assert.ok(owner, "An explicit owner filter is required");
            const result = await db.query(
              "select id,title,description,due_date,completed from public.tasks where user_id=$1 order by id limit $2 offset $3",
              [owner, end - start + 1, start],
            );
            return {
              data: result.rows.map((task) => ({
                ...task,
                due_date: task.due_date?.toISOString() || null,
              })),
              error: null,
            };
          },
        };
        return query;
      },
    };
  };
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    state.providerCalls.push([url.href, init.method || "GET"]);
    if (url.href === "https://oauth2.googleapis.com/token") {
      const parameters = new URLSearchParams(init.body);
      assert.equal(
        parameters.get("client_secret"),
        "server-only-client-secret",
      );
      if (parameters.get("grant_type") === "authorization_code") {
        state.tokenExchanges++;
        assert.equal(
          await sha256(parameters.get("code_verifier")),
          state.challenge,
        );
        assert.equal(
          parameters.get("redirect_uri"),
          `${server}/functions/v1/google-oauth/callback`,
        );
      } else {
        state.refreshes++;
        assert.equal(parameters.get("refresh_token"), "private-google-refresh");
        if (state.providerError === "invalid_grant")
          return Response.json({ error: "invalid_grant" }, { status: 400 });
      }
      return Response.json({
        access_token: "private-google-access",
        refresh_token: "private-google-refresh",
        expires_in: 3600,
        scope: state.scopes.join(" "),
      });
    }
    if (url.href === "https://openidconnect.googleapis.com/v1/userinfo")
      return Response.json({
        sub: "google-alice",
        email: "alice@google.example",
        email_verified: true,
      });
    if (url.href === "https://oauth2.googleapis.com/revoke") {
      assert.equal(
        new URLSearchParams(init.body).get("token"),
        "private-google-refresh",
      );
      return new Response(null, { status: state.revokeError ? 503 : 200 });
    }
    assert.equal(init.headers.Authorization, "Bearer private-google-access");
    if (state.providerError && state.providerError !== "invalid_grant")
      return Response.json(
        { error: "provider diagnostic must never leak" },
        { status: state.providerError },
      );
    if (url.pathname === "/calendar/v3/users/me/calendarList")
      return Response.json({
        items: [
          {
            id: "calendar-one",
            summary: "Agenda réel",
            primary: true,
            accessRole: "owner",
          },
        ],
      });
    if (url.pathname === "/calendar/v3/calendars/calendar-one/events") {
      if (init.method === "POST") {
        const event = JSON.parse(init.body);
        if (state.calendar.has(event.id))
          return Response.json({ error: "duplicate" }, { status: 409 });
        assert.ok(!event.attendees);
        const saved = { ...event, etag: '"created"' };
        state.calendar.set(saved.id, saved);
        return Response.json(saved);
      }
      assert.equal(url.searchParams.get("singleEvents"), "true");
      assert.ok(
        url.searchParams.get("timeMin") < url.searchParams.get("timeMax"),
      );
      return Response.json({
        items: [...state.calendar.values()],
      });
    }
    if (
      url.pathname.startsWith("/calendar/v3/calendars/calendar-one/events/")
    ) {
      const id = decodeURIComponent(url.pathname.split("/").at(-1));
      const event = state.calendar.get(id);
      if (!event) return Response.json({ error: "missing" }, { status: 404 });
      if (!init.method || init.method === "GET") return Response.json(event);
      assert.equal(typeof init.headers["If-Match"], "string");
      if (init.headers["If-Match"] !== event.etag)
        return Response.json({ error: "changed" }, { status: 412 });
      if (init.method === "PATCH") {
        const patched = {
          ...event,
          ...JSON.parse(init.body),
          etag: '"updated"',
        };
        state.calendar.set(id, patched);
        return Response.json(patched);
      }
      if (init.method === "DELETE") {
        state.calendar.delete(id);
        return new Response(null, { status: 204 });
      }
    }
    if (url.pathname === "/tasks/v1/users/@me/lists")
      return Response.json({
        items: [{ id: "list-one", title: "Liste réelle" }],
      });
    if (
      url.pathname === "/tasks/v1/lists/list-one/tasks" &&
      (!init.method || init.method === "GET")
    ) {
      assert.equal(url.searchParams.get("showCompleted"), "true");
      assert.equal(url.searchParams.get("showHidden"), "true");
      assert.equal(url.searchParams.get("showDeleted"), "true");
      const offset = Number(url.searchParams.get("pageToken") || 0);
      const items = [...state.remote.values()];
      return Response.json({
        items: items.slice(offset, offset + 100),
        ...(items.length > offset + 100
          ? { nextPageToken: String(offset + 100) }
          : {}),
      });
    }
    if (
      url.pathname === "/tasks/v1/lists/list-one/tasks" &&
      init.method === "POST"
    ) {
      state.posts++;
      const task = {
        ...JSON.parse(init.body),
        id: `created-${state.nextId++}`,
        updated: `version-${state.nextId}`,
      };
      state.remote.set(task.id, task);
      return Response.json(task);
    }
    if (
      url.pathname.startsWith("/tasks/v1/lists/list-one/tasks/") &&
      init.method === "PATCH"
    ) {
      state.patches++;
      const id = decodeURIComponent(url.pathname.split("/").at(-1));
      assert.ok(state.remote.has(id));
      const task = {
        ...state.remote.get(id),
        ...JSON.parse(init.body),
        updated: `patched-${state.patches}`,
      };
      state.remote.set(id, task);
      return Response.json(task);
    }
    throw new Error(`Unexpected Google route: ${url.href}`);
  };
}

function request(action, extra = {}, token = "alice-jwt", origin = app) {
  return new Request(`${server}/functions/v1/google-api`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      origin,
    },
    body: JSON.stringify({ action, ...extra }),
  });
}
async function apiCall(action, extra = {}, token = "alice-jwt") {
  const response = await api(request(action, extra, token));
  return { response, data: await response.json() };
}
async function startFlow() {
  const started = await oauth(request("start"));
  assert.equal(started.status, 200);
  const start = new URL((await started.json()).url);
  const begin = await oauth(new Request(start));
  assert.equal(begin.status, 303);
  const consent = new URL(begin.headers.get("location"));
  assert.equal(consent.origin, "https://accounts.google.com");
  assert.equal(consent.searchParams.get("code_challenge_method"), "S256");
  assert.equal(consent.searchParams.get("scope"), GOOGLE_SCOPES.join(" "));
  state.challenge = consent.searchParams.get("code_challenge");
  const cookie = begin.headers.get("set-cookie");
  assert.ok(
    cookie.includes("HttpOnly") &&
      cookie.includes("Secure") &&
      cookie.includes("SameSite=Lax"),
  );
  const callback = `${server}/functions/v1/google-oauth/callback?state=${consent.searchParams.get("state")}&code=authorization-code`;
  return { start, cookie: cookie.split(";")[0], callback };
}
async function linked() {
  const flow = await startFlow();
  const callback = await oauth(
    new Request(flow.callback, { headers: { cookie: flow.cookie } }),
  );
  const redirect = new URL(callback.headers.get("location"));
  assert.equal(redirect.origin, app);
  assert.equal(redirect.searchParams.get("google"), "ready");
  assert.equal(
    (
      await apiCall("complete", {
        confirmation: redirect.searchParams.get("confirmation"),
      })
    ).response.status,
    200,
  );
  return flow;
}

test.after(async () => {
  globalThis.fetch = originalFetch;
  await db.close();
});

test("OAuth completes PKCE server-side, keeps tokens encrypted, binds final confirmation to the original user and rejects replays", async () => {
  await reset();
  const flow = await startFlow();
  const callback = await oauth(
    new Request(flow.callback, { headers: { cookie: flow.cookie } }),
  );
  const redirect = new URL(callback.headers.get("location"));
  assert.equal(redirect.searchParams.get("google"), "ready");
  const confirmation = redirect.searchParams.get("confirmation");
  assert.equal((await apiCall("status")).data.connected, false);
  assert.equal(
    (await apiCall("complete", { confirmation }, "bob-jwt")).response.status,
    400,
  );
  assert.equal((await apiCall("status")).data.connected, false);
  assert.equal(
    (await apiCall("complete", { confirmation })).response.status,
    200,
  );
  assert.equal(
    (await apiCall("complete", { confirmation })).response.status,
    400,
  );
  const status = await apiCall("status");
  assert.equal(status.data.accountEmail, "alice@google.example");
  assert.equal(status.data.connected, true);
  assert.ok(!JSON.stringify(status.data).includes("private-google"));
  const row = (await db.query("select * from google_private.connections"))
    .rows[0];
  assert.ok(!row.tokens_cipher.includes("private-google"));
  assert.equal(
    JSON.parse(
      await decrypt(
        row.tokens_cipher,
        encryptionKey,
        `tokens:${alice}:google-alice`,
      ),
    ).refresh_token,
    "private-google-refresh",
  );
  const replay = await oauth(
    new Request(flow.callback, { headers: { cookie: flow.cookie } }),
  );
  assert.equal(
    new URL(replay.headers.get("location")).searchParams.get("google"),
    "invalid_state",
  );
  assert.equal(state.tokenExchanges, 1);
});

test("OAuth rejects missing cookies, expired state and partial permissions before any account is linked", async () => {
  await reset();
  const flow = await startFlow();
  const noCookie = await oauth(new Request(flow.callback));
  assert.equal(
    new URL(noCookie.headers.get("location")).searchParams.get("google"),
    "invalid_state",
  );
  assert.equal(state.tokenExchanges, 0);
  await db.exec(
    "update google_private.oauth_states set expires_at=now()-interval '1 second'",
  );
  const expired = await oauth(
    new Request(flow.callback, { headers: { cookie: flow.cookie } }),
  );
  assert.equal(
    new URL(expired.headers.get("location")).searchParams.get("google"),
    "invalid_state",
  );
  await reset();
  const partial = await startFlow();
  state.scopes = state.scopes.filter((scope) => !scope.endsWith("/tasks"));
  const declined = await oauth(
    new Request(partial.callback, { headers: { cookie: partial.cookie } }),
  );
  assert.equal(
    new URL(declined.headers.get("location")).searchParams.get("google"),
    "incomplete",
  );
  assert.equal((await apiCall("status")).data.connected, false);
});

test("missing/expired/anonymous sessions, forged origins and oversized chunked requests are rejected before provider calls", async () => {
  await reset();
  assert.equal((await api(request("status", {}, ""))).status, 401);
  state.authExpired = true;
  assert.equal((await oauth(request("start"))).status, 401);
  state.authExpired = false;
  state.authAnonymous = true;
  assert.equal((await api(request("status"))).status, 401);
  state.authAnonymous = false;
  assert.equal(
    (await api(request("status", {}, "alice-jwt", "https://attacker.example")))
      .status,
    403,
  );
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("x".repeat(5000)));
      controller.close();
    },
  });
  const oversized = new Request(`${server}/functions/v1/google-api`, {
    method: "POST",
    headers: { authorization: "Bearer alice-jwt", origin: app },
    body: stream,
    duplex: "half",
  });
  assert.equal((await api(oversized)).status, 413);
  assert.equal(state.providerCalls.length, 0);
  assert.equal(state.rpcCalls.length, 0);
});

test("real Calendar/Tasks resources are returned with event pagination parameters and safe external links", async () => {
  await reset();
  await linked();
  const resources = await apiCall("resources");
  assert.equal(resources.response.status, 200);
  assert.equal(resources.data.calendars[0].summary, "Agenda réel");
  assert.equal(resources.data.calendars[0].writable, true);
  assert.equal(resources.data.tasklists[0].title, "Liste réelle");
  const events = await apiCall("events", { calendarId: "calendar-one" });
  assert.equal(events.response.status, 200);
  assert.equal(events.data.events.length, 2);
  assert.equal(events.data.events[1].start.date, "2026-11-05");
  assert.equal(events.data.events[1].htmlLink, null);
  assert.ok(!JSON.stringify(resources.data).includes("private-google"));
});

test("Calendar creates are idempotent; edits preserve unrelated fields and deletions accept Google's 204", async () => {
  await reset();
  await linked();
  const fields = {
    summary: "Révision",
    description: "Chapitre 1",
    location: "BU",
    start: { dateTime: "2026-11-04T12:00:00Z" },
    end: { dateTime: "2026-11-04T13:00:00Z" },
  };
  const requestId = "1234567890abcdef1234567890abcdef";
  const created = await apiCall("event_create", {
    calendarId: "calendar-one",
    event: fields,
    requestId,
  });
  assert.equal(created.response.status, 200);
  assert.equal(created.data.event.summary, "Révision");
  const retry = await apiCall("event_create", {
    calendarId: "calendar-one",
    event: fields,
    requestId,
  });
  assert.equal(retry.response.status, 200);
  assert.equal(retry.data.event.id, created.data.event.id);
  assert.equal(state.calendar.size, 4);
  const changedRetry = await apiCall("event_create", {
    calendarId: "calendar-one",
    event: { ...fields, summary: "Contenu différent" },
    requestId,
  });
  assert.equal(changedRetry.response.status, 409);
  assert.equal(changedRetry.data.code, "event_already_created");
  assert.equal(state.calendar.get(created.data.event.id).summary, "Révision");
  const id = created.data.event.id;
  const changed = await apiCall("event_update", {
    calendarId: "calendar-one",
    eventId: id,
    etag: created.data.event.etag,
    event: { ...fields, summary: "Révision terminée" },
  });
  assert.equal(changed.response.status, 200);
  assert.equal(changed.data.event.summary, "Révision terminée");
  assert.equal(
    state.calendar.get(id).extendedProperties.private.deepflowOwner,
    alice,
  );
  const stale = await apiCall("event_update", {
    calendarId: "calendar-one",
    eventId: id,
    etag: created.data.event.etag,
    event: fields,
  });
  assert.equal(stale.response.status, 409);
  assert.equal(stale.data.code, "event_conflict");
  assert.equal(state.calendar.get(id).summary, "Révision terminée");
  const removed = await apiCall("event_delete", {
    calendarId: "calendar-one",
    eventId: id,
    etag: changed.data.event.etag,
  });
  assert.equal(removed.response.status, 200);
  assert.equal(removed.data.deleted, true);
  assert.ok(!state.calendar.has(id));
});

test("Calendar rejects invalid dates and ranges, stale deletions, read-only consent and guest event mutations", async () => {
  await reset();
  await linked();
  assert.equal(
    (
      await apiCall("events", {
        calendarId: "calendar-one",
        timeMin: "2026-01-01T00:00:00Z",
        timeMax: "2026-12-31T00:00:00Z",
      })
    ).response.status,
    400,
  );
  const fields = {
    summary: "Journée",
    start: { date: "2026-02-30" },
    end: { date: "2026-03-01" },
  };
  assert.equal(
    (
      await apiCall("event_create", {
        calendarId: "calendar-one",
        event: fields,
        requestId: "1234567890abcdef1234567890abcdef",
      })
    ).response.status,
    400,
  );
  const stale = await apiCall("event_delete", {
    calendarId: "calendar-one",
    eventId: "event-one",
    etag: '"old"',
  });
  assert.equal(stale.response.status, 409);
  assert.ok(state.calendar.has("event-one"));
  state.calendar.get("event-one").attendees = [{ email: "guest@example.test" }];
  const guests = await apiCall("event_delete", {
    calendarId: "calendar-one",
    eventId: "event-one",
    etag: '"v1"',
  });
  assert.equal(guests.response.status, 409);
  assert.equal(guests.data.code, "event_requires_google");
  const list = await apiCall("events", { calendarId: "calendar-one" });
  assert.equal(list.data.events[0].editable, false);
  await db.query(
    "update google_private.connections set scopes=array['openid','email','https://www.googleapis.com/auth/calendar.events.readonly'] where user_id=$1",
    [alice],
  );
  assert.equal((await apiCall("status")).data.canEditCalendar, false);
  const scopes = await apiCall("event_delete", {
    calendarId: "calendar-one",
    eventId: "event-two",
    etag: '"v2"',
  });
  assert.equal(scopes.response.status, 409);
  assert.equal(scopes.data.code, "calendar_scope_required");
});

test("retired Google OAuth never exchanges codes or accepts client-supplied user IDs", async () => {
  await reset();
  assert.equal(
    (await retiredGoogleOAuth(request("get_auth_url", { user_id: bob }, "")))
      .status,
    401,
  );
  const retired = await retiredGoogleOAuth(
    request("get_auth_url", { user_id: bob }),
  );
  assert.equal(retired.status, 410);
  assert.equal((await retired.json()).code, "legacy_google_retired");
  const callback = await retiredGoogleOAuth(
    new Request(
      `${server}/functions/v1/google-calendar-oauth?code=old-code&state=${alice}`,
    ),
  );
  assert.equal(callback.status, 410);
  assert.equal(state.providerCalls.length, 0);
  assert.equal(state.rpcCalls.length, 0);
});

test("Google pull imports completed tasks once, updates existing tasks, and push preserves IDs and reopens completion", async () => {
  await reset();
  await linked();
  state.remote.set("remote-active", {
    id: "remote-active",
    title: "Active",
    status: "needsAction",
    updated: "v1",
    due: "2026-11-04T00:00:00Z",
  });
  state.remote.set("remote-done", {
    id: "remote-done",
    title: "Terminée",
    notes: "Notes",
    status: "completed",
    hidden: true,
    updated: "v1",
  });
  const first = await apiCall("pull", { listId: "list-one" });
  assert.equal(first.response.status, 200);
  assert.equal(first.data.transferred, 2);
  assert.equal(
    (await apiCall("pull", { listId: "list-one" })).data.transferred,
    0,
  );
  assert.equal(
    (await db.query("select count(*)::int n from public.tasks")).rows[0].n,
    2,
  );
  const imported = (
    await db.query("select * from public.tasks where title='Terminée'")
  ).rows[0];
  assert.equal(imported.completed, true);
  await db.query(
    "update public.tasks set completed=false,title=$1 where id=$2",
    ["Réouverte", imported.id],
  );
  const push = await apiCall("push", { listId: "list-one" });
  assert.equal(push.response.status, 200);
  assert.equal(push.data.transferred, 1);
  assert.equal(state.posts, 0);
  assert.equal(state.patches, 1);
  assert.equal(state.remote.get("remote-done").status, "needsAction");
  assert.equal(state.remote.get("remote-done").completed, null);
  assert.equal(state.remote.get("remote-done").title, "Réouverte");
  assert.equal(
    (await apiCall("push", { listId: "list-one" })).data.transferred,
    0,
  );
  state.remote.get("remote-active").title = "Modifiée dans Google";
  state.remote.get("remote-active").updated = "v2";
  assert.equal(
    (await apiCall("pull", { listId: "list-one" })).data.transferred,
    1,
  );
  assert.equal(
    (
      await db.query(
        "select count(*)::int n from public.tasks where title='Modifiée dans Google'",
      )
    ).rows[0].n,
    1,
  );
});

test("interrupted mapping writes recover remote creates by marker without duplicate Google tasks", async () => {
  await reset();
  await linked();
  const local = (
    await db.query(
      "insert into public.tasks(user_id,title,description,completed) values($1,$2,$3,false) returning id",
      [alice, "New task", "Notes"],
    )
  ).rows[0];
  state.failMap = true;
  assert.equal(
    (await apiCall("push", { listId: "list-one" })).response.status,
    500,
  );
  assert.equal(state.posts, 1);
  assert.equal(state.remote.size, 1);
  assert.ok(
    [...state.remote.values()][0].notes.includes(taskMarker(alice, local.id)),
  );
  const retry = await apiCall("push", { listId: "list-one" });
  assert.equal(retry.response.status, 200);
  assert.equal(retry.data.transferred, 1);
  assert.equal(state.posts, 1);
  assert.equal(state.remote.size, 1);
  assert.equal(
    (await db.query("select count(*)::int n from google_private.task_mappings"))
      .rows[0].n,
    1,
  );
});

test("deleted remote task recreation replaces its mapping and each batch stops at forty changes", async () => {
  await reset();
  await linked();
  await db.query(
    "insert into public.tasks(user_id,title,completed) select $1,'Task '||n,false from generate_series(1,45) n",
    [alice],
  );
  const first = await apiCall("push", { listId: "list-one" });
  assert.equal(first.data.transferred, 40);
  assert.equal(first.data.remaining, 5);
  const second = await apiCall("push", { listId: "list-one" });
  assert.equal(second.data.transferred, 5);
  assert.equal(second.data.remaining, 0);
  assert.equal(state.posts, 45);
  const mapping = (
    await db.query("select * from google_private.task_mappings limit 1")
  ).rows[0];
  state.remote.get(mapping.google_task_id).deleted = true;
  await db.query(
    "update public.tasks set title=title||' changed' where id=$1",
    [mapping.local_task_id],
  );
  const recreated = await apiCall("push", { listId: "list-one" });
  assert.equal(recreated.response.status, 200);
  assert.equal(recreated.data.transferred, 1);
  const replaced = (
    await db.query(
      "select * from google_private.task_mappings where local_task_id=$1",
      [mapping.local_task_id],
    )
  ).rows;
  assert.equal(replaced.length, 1);
  assert.notEqual(replaced[0].google_task_id, mapping.google_task_id);
});

test("expired tokens refresh only server-side and invalid grants request reconnection without leaking provider diagnostics", async () => {
  await reset();
  await linked();
  const expired = await encrypt(
    JSON.stringify({
      access_token: "expired",
      refresh_token: "private-google-refresh",
      expires_at: 0,
    }),
    encryptionKey,
    `tokens:${alice}:google-alice`,
  );
  await db.query(
    "update google_private.connections set tokens_cipher=$1 where user_id=$2",
    [expired, alice],
  );
  assert.equal((await apiCall("resources")).response.status, 200);
  assert.equal(state.refreshes, 1);
  await db.query(
    "update google_private.connections set tokens_cipher=$1 where user_id=$2",
    [expired, alice],
  );
  state.providerError = "invalid_grant";
  const revoked = await apiCall("resources");
  assert.equal(revoked.response.status, 401);
  assert.equal(revoked.data.code, "reconnect_required");
  assert.equal((await apiCall("status")).data.needsReconnect, true);
  assert.ok(!JSON.stringify(revoked.data).includes("private-google"));
  state.providerError = 403;
  const inaccessible = await apiCall("resources");
  assert.ok(!JSON.stringify(inaccessible.data).includes("provider diagnostic"));
});

test("disconnect retries a failed provider revocation, then removes tokens while preserving owned tasks", async () => {
  await reset();
  await linked();
  await db.query("insert into public.tasks(user_id,title) values($1,$2)", [
    alice,
    "Keep this task",
  ]);
  state.revokeError = true;
  assert.equal((await apiCall("disconnect")).response.status, 502);
  assert.equal((await apiCall("status")).data.connected, true);
  state.revokeError = false;
  assert.equal((await apiCall("disconnect")).response.status, 200);
  assert.equal((await apiCall("status")).data.connected, false);
  assert.equal(
    (await db.query("select count(*)::int n from public.tasks")).rows[0].n,
    1,
  );
  assert.equal(
    (await db.query("select count(*)::int n from google_private.connections"))
      .rows[0].n,
    0,
  );
});
