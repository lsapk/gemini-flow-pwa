import test from "node:test";
import assert from "node:assert/strict";
import { readAllPages } from "../src/lib/pagination.ts";
import {
  planTasks,
  taskDateKey,
  formatTaskDate,
} from "../src/lib/task-planning.ts";

test("pending task beyond the first 1000 completed rows remains available to filters", async () => {
  const tasks = Array.from({ length: 1201 }, (_, index) => ({
    id: String(index),
    title: `Tâche ${index}`,
    completed: index !== 1200,
  }));
  const rows = await readAllPages((from, to) =>
    Promise.resolve({ data: tasks.slice(from, to + 1), error: null }),
  );
  assert.equal(rows.length, 1201);
  assert.equal(
    planTasks(rows, { status: "pending", search: "", sort: "due" })[0].id,
    "1200",
  );
});
test("page failure or configured bound fails the whole read rather than returning partial data", async () => {
  await assert.rejects(
    readAllPages((from) =>
      Promise.resolve(
        from === 0
          ? { data: Array(500).fill({ id: 1 }), error: null }
          : { data: null, error: { message: "Network failure" } },
      ),
    ),
    /Network failure/,
  );
  await assert.rejects(
    readAllPages(
      () => Promise.resolve({ data: Array(500).fill(1), error: null }),
      500,
    ),
    /Aucun résultat partiel/,
  );
});
test("task date editing and display agree with Paris filters independently of device timezone", () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = "America/New_York";
    assert.equal(taskDateKey("2026-11-04T00:00:00+00:00"), "2026-11-04");
    assert.match(formatTaskDate("2026-11-04T00:00:00+00:00"), /04 nov/);
    assert.equal(taskDateKey("2026-11-04"), "2026-11-04");
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
