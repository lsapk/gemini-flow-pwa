import assert from "node:assert/strict";
import test from "node:test";
import {
  appOrigin,
  calendarEventFields,
  calendarRange,
  collectGooglePages,
  cookieValue,
  decrypt,
  encrypt,
  eventRequestId,
  eventVersion,
  exportTask,
  GOOGLE_SCOPES,
  hasRequiredScopes,
  importTask,
  randomSecret,
  removeMarker,
  resourceId,
  sha256,
  taskFingerprint,
  taskMarker,
} from "./google-domain.ts";

const userId = "11111111-1111-4111-8111-111111111111";
const taskId = "22222222-2222-4222-8222-222222222222";
const task = {
  id: taskId,
  title: "Préparer la semaine",
  description: "Trois priorités",
  due_date: "2026-11-03",
  completed: false,
};

test("redirect allowlist accepts only a configured HTTPS origin or local HTTP", () => {
  assert.equal(
    appOrigin("https://deepflow.example"),
    "https://deepflow.example",
  );
  assert.equal(appOrigin("http://localhost:5173"), "http://localhost:5173");
  for (const value of [
    "http://evil.example",
    "https://user:pass@deepflow.example",
    "https://deepflow.example/redirect",
    "https://deepflow.example/?next=https://evil.example",
  ])
    assert.throws(() => appOrigin(value));
});

test("PKCE challenge matches the RFC 7636 S256 vector", async () => {
  assert.equal(
    await sha256("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"),
    "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  );
  const generated = randomSecret();
  assert.match(generated, /^[a-zA-Z0-9_-]{43}$/);
  assert.notEqual(generated, randomSecret());
});

test("AES-GCM encrypts with unique IVs and binds tokens to their user/account", async () => {
  const key = randomSecret();
  const first = await encrypt(
    "private-refresh-token",
    key,
    "tokens:user:account",
  );
  const second = await encrypt(
    "private-refresh-token",
    key,
    "tokens:user:account",
  );
  assert.notEqual(first, second);
  assert.ok(!first.includes("private-refresh-token"));
  assert.equal(
    await decrypt(first, key, "tokens:user:account"),
    "private-refresh-token",
  );
  await assert.rejects(decrypt(first, key, "tokens:other:account"));
  await assert.rejects(decrypt(first, randomSecret(), "tokens:user:account"));
  const [iv, ciphertext] = first.split(".");
  await assert.rejects(
    decrypt(
      `${iv}.${ciphertext[0] === "A" ? "B" : "A"}${ciphertext.slice(1)}`,
      key,
      "tokens:user:account",
    ),
  );
  await assert.rejects(encrypt("token", "bad-key", "context"));
});

test("partial consent is rejected and Google email scope normalization is accepted", () => {
  assert.ok(hasRequiredScopes([...GOOGLE_SCOPES]));
  assert.ok(
    hasRequiredScopes(
      GOOGLE_SCOPES.map((scope) =>
        scope === "email"
          ? "https://www.googleapis.com/auth/userinfo.email"
          : scope,
      ),
    ),
  );
  assert.equal(
    hasRequiredScopes(
      GOOGLE_SCOPES.filter((scope) => !scope.endsWith("/tasks")),
    ),
    false,
  );
  assert.equal(
    hasRequiredScopes(
      GOOGLE_SCOPES.map((scope) =>
        scope.replace("calendar.events", "calendar.events.readonly"),
      ),
    ),
    false,
  );
});

test("event fields validate real dates, offset timestamps, order and length without accepting invitations", () => {
  const valid = {
    summary: " Révisions ",
    start: { dateTime: "2026-11-04T10:00:00+01:00" },
    end: { dateTime: "2026-11-04T11:00:00+01:00" },
  };
  assert.deepEqual(
    calendarEventFields({
      ...valid,
      attendees: [{ email: "guest@example.test" }],
      recurrence: ["RRULE:FREQ=DAILY"],
    }),
    { ...valid, summary: "Révisions", description: "", location: "" },
  );
  assert.equal(
    calendarEventFields({
      summary: "Jour entier",
      start: { date: "2028-02-29" },
      end: { date: "2028-03-01" },
    }).start.date,
    "2028-02-29",
  );
  for (const event of [
    { ...valid, summary: " " },
    { ...valid, summary: "x".repeat(201) },
    { ...valid, start: { dateTime: "2026-11-04T10:00:00" } },
    { ...valid, start: { dateTime: "2026-02-30T10:00:00Z" } },
    { ...valid, start: { dateTime: "2026-11-04T25:00:00Z" } },
    { ...valid, end: valid.start },
    { ...valid, end: { date: "2026-11-05" } },
    { ...valid, start: { date: "2026-02-29" }, end: { date: "2026-03-01" } },
  ])
    assert.throws(() => calendarEventFields(event));
});

test("event ranges, conditional versions and stable creation IDs reject malformed inputs", () => {
  assert.deepEqual(
    calendarRange("2026-11-04T00:00:00+01:00", "2026-11-11T00:00:00+01:00"),
    { start: "2026-11-03T23:00:00.000Z", end: "2026-11-10T23:00:00.000Z" },
  );
  assert.throws(() =>
    calendarRange("2026-11-04T00:00:00Z", "2026-11-03T00:00:00Z"),
  );
  assert.throws(() =>
    calendarRange("2026-01-01T00:00:00Z", "2026-12-31T00:00:00Z"),
  );
  assert.equal(eventVersion('"v1"'), '"v1"');
  assert.throws(() => eventVersion('"v1"\r\nInjected: yes'));
  assert.throws(() => eventVersion(null));
  assert.equal(
    eventRequestId("1234567890abcdef1234567890abcdef"),
    "1234567890abcdef1234567890abcdef",
  );
  assert.throws(() => eventRequestId("user-supplied/route"));
});

test("Google import retains date-only due dates and completion including hidden tasks", () => {
  assert.deepEqual(
    importTask({
      id: "google-task",
      title: " Fait ",
      due: "2026-11-03T00:00:00.000Z",
      status: "completed",
      notes: `Notes\n${taskMarker(userId, taskId)}`,
    }),
    {
      title: "Fait",
      description: "Notes",
      due_date: "2026-11-03",
      completed: true,
    },
  );
  assert.equal(importTask({ id: "g", status: "needsAction" }).completed, false);
  assert.throws(() => importTask({ id: "g", deleted: true }));
});

test("Google export reopens completed tasks and clears absent due dates", () => {
  const exported = exportTask({ ...task, due_date: null }, userId);
  assert.equal(exported.status, "needsAction");
  assert.equal(exported.completed, null);
  assert.equal(exported.due, null);
  assert.equal(
    exported.notes,
    `Trois priorités\n${taskMarker(userId, taskId)}`,
  );
  assert.equal(exportTask(task, userId).due, "2026-11-03T00:00:00.000Z");
  assert.equal(
    exportTask({ ...task, completed: true }, userId).status,
    "completed",
  );
});

test("stable export markers survive retries without accumulating in notes", () => {
  const once = exportTask(task, userId);
  const retry = exportTask({ ...task, description: once.notes }, userId);
  assert.equal(retry.notes, once.notes);
  assert.equal(
    removeMarker("A normal [deepflow:note]"),
    "A normal [deepflow:note]",
  );
  assert.throws(() => exportTask({ ...task, title: "x".repeat(1025) }, userId));
  assert.throws(() =>
    exportTask({ ...task, description: "x".repeat(8192) }, userId),
  );
});

test("fingerprints distinguish completion changes and normalize date-only fields", async () => {
  assert.equal(
    await taskFingerprint(task),
    await taskFingerprint({
      ...task,
      id: "a-different-id",
      due_date: "2026-11-03T00:00:00Z",
    }),
  );
  assert.notEqual(
    await taskFingerprint(task),
    await taskFingerprint({ ...task, completed: true }),
  );
});

test("callback cookies and resource inputs reject malformed values", () => {
  const nonce = randomSecret();
  assert.equal(
    cookieValue(
      `other=x; deepflow_google_nonce=${nonce}; next=y`,
      "deepflow_google_nonce",
    ),
    nonce,
  );
  assert.equal(
    cookieValue("deepflow_google_nonce=invalid", "deepflow_google_nonce"),
    null,
  );
  for (const value of [null, "", ".", "..", "\nheader", "x".repeat(1025)])
    assert.throws(() => resourceId(value));
  assert.equal(resourceId("someone@example.com"), "someone@example.com");
});

test("pagination includes every page and refuses loops and silent truncation", async () => {
  const calls: (string | undefined)[] = [];
  assert.deepEqual(
    await collectGooglePages<number>(async (token) => {
      calls.push(token);
      return token ? { items: [3] } : { items: [1, 2], nextPageToken: "next" };
    }, 3),
    [1, 2, 3],
  );
  assert.deepEqual(calls, [undefined, "next"]);
  await assert.rejects(collectGooglePages(async () => ({ items: [1, 2] }), 1));
  await assert.rejects(
    collectGooglePages(async () => ({ nextPageToken: "loop" }), 100),
  );
  await assert.rejects(
    collectGooglePages(async () => {
      throw new Error("provider failed");
    }, 100),
    /provider failed/,
  );
});
