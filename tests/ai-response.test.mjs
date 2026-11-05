import test from "node:test";
import assert from "node:assert/strict";
import {
  insightSchema,
  parseAIJson,
  personalitySchema,
} from "../src/lib/ai-response.ts";
import { localProductivityScore } from "../src/lib/productivity-score.ts";

test("AI insights accept complete bounded JSON and reject missing/render-breaking fields", () => {
  const valid = [
    {
      id: "a",
      title: "Focus",
      insight: "Une séance",
      recommendation: "Une pause",
      priority: "low",
    },
  ];
  assert.deepEqual(
    parseAIJson("```json\n" + JSON.stringify(valid) + "\n```", insightSchema),
    valid,
  );
  assert.throws(
    () =>
      parseAIJson(JSON.stringify([{ title: "Missing fields" }]), insightSchema),
    /incomplète/,
  );
  assert.throws(
    () =>
      parseAIJson(
        JSON.stringify([{ ...valid[0], priority: "__proto__" }]),
        insightSchema,
      ),
    /incomplète/,
  );
  assert.throws(
    () => parseAIJson("Some text " + JSON.stringify(valid), insightSchema),
    /JSON valide/,
  );
  assert.throws(
    () => parseAIJson("x".repeat(40001), insightSchema),
    /invalide/,
  );
});

test("personality responses cannot reach components with missing nested lists", () => {
  assert.throws(
    () => parseAIJson('{"personality":{"traits":[]}}', personalitySchema),
    /incomplète/,
  );
  assert.throws(
    () => parseAIJson('{"personality":null}', personalitySchema),
    /incomplète/,
  );
});

test("local score has no fabricated starting credit and uses stored minutes directly", () => {
  const empty = {
    taskCompletionRate: 0,
    tasksData: [],
    focusData: [],
    habitsData: [],
  };
  assert.equal(localProductivityScore(empty).score, 0);
  const result = localProductivityScore({
    taskCompletionRate: 100,
    tasksData: [{ completed: 1, pending: 0 }],
    focusData: [{ minutes: 420 }],
    habitsData: [{ value: 7 }],
  });
  assert.equal(result.score, 100);
  assert.equal(result.focusTimeScore, 25);
  assert.equal(result.journalScore, 0);
  assert.equal(result.qualityScore, 0);
  assert.equal(
    localProductivityScore({ ...empty, taskCompletionRate: Infinity }).score,
    0,
  );
});
