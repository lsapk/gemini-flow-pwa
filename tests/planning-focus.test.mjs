import test from "node:test";
import assert from "node:assert/strict";
import { planTasks, parisDateKey } from "../src/lib/task-planning.ts";
import {
  remainingFocusSeconds,
  pauseFocus,
  resumeFocus,
  readFocusSession,
} from "../src/lib/focus-session.ts";
test("Paris dates across midnight and daylight saving", () => {
  assert.equal(parisDateKey(new Date("2026-10-24T22:30:00Z")), "2026-10-25");
  assert.equal(parisDateKey(new Date("2026-10-25T23:30:00Z")), "2026-10-26");
});
test("tasks rank by actual deadline then priority without mutating source", () => {
  const tasks = [
    {
      id: "a",
      title: "Plus tard",
      priority: "high",
      due_date: "2026-11-10",
      completed: false,
    },
    {
      id: "b",
      title: "Urgent",
      priority: "low",
      due_date: "2026-11-01",
      completed: false,
    },
    {
      id: "c",
      title: "Terminée",
      priority: "high",
      due_date: "2026-11-01",
      completed: true,
    },
    { id: "d", title: "Sans échéance", due_date: "invalid", completed: false },
  ];
  assert.deepEqual(
    planTasks(tasks, { status: "pending", search: "", sort: "due" }).map(
      (item) => item.id,
    ),
    ["b", "a", "d"],
  );
  assert.deepEqual(
    planTasks(tasks, {
      status: "overdue",
      search: "",
      sort: "due",
      now: new Date("2026-11-03T09:00:00Z"),
    }).map((item) => item.id),
    ["b"],
  );
  assert.deepEqual(
    tasks.map((item) => item.id),
    ["a", "b", "c", "d"],
  );
});
test("search and completed filters respect French case and completion", () => {
  const rows = [{ id: "a", title: "ÉCONOMIE", completed: true }];
  assert.equal(
    planTasks(rows, { status: "completed", search: "économie", sort: "recent" })
      .length,
    1,
  );
  assert.equal(
    planTasks(rows, { status: "today", search: "", sort: "due" }).length,
    0,
  );
});
test("focus deadline survives delayed ticks and pause/resume without losing pause time", () => {
  const session = {
    id: "11111111-1111-4111-8111-111111111111",
    userId: "alice",
    title: "Cours",
    totalSeconds: 1500,
    remainingSeconds: 1500,
    deadline: 1500000,
    startedAt: 0,
  };
  assert.equal(remainingFocusSeconds(session, 300000), 1200);
  const paused = pauseFocus(session, 300000);
  assert.equal(remainingFocusSeconds(paused, 900000), 1200);
  const resumed = resumeFocus(paused, 900000);
  assert.equal(remainingFocusSeconds(resumed, 1200000), 900);
  assert.equal(remainingFocusSeconds(resumed, 9999999), 0);
});
test("corrupt or other-user local focus state is rejected", () => {
  assert.equal(readFocusSession("{broken", "alice"), null);
  const session = {
    id: "11111111-1111-4111-8111-111111111111",
    userId: "bob",
    title: "Private",
    totalSeconds: 1500,
    remainingSeconds: 1500,
    deadline: null,
    startedAt: 0,
  };
  assert.equal(readFocusSession(JSON.stringify(session), "alice"), null);
  assert.ok(readFocusSession(JSON.stringify(session), "bob"));
  assert.equal(
    readFocusSession(JSON.stringify({ ...session, totalSeconds: -1 }), "bob"),
    null,
  );
});
