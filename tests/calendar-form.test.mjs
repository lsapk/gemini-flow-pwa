import test from "node:test";
import assert from "node:assert/strict";
import {
  localDateTime,
  inputDateTime,
  shiftCalendarDay,
} from "../src/lib/calendar-form.ts";

test("calendar forms retain local wall time and reject invalid or nonexistent dates", () => {
  const parsed = localDateTime("2026-11-04T13:30");
  assert.equal(inputDateTime(new Date(parsed)), "2026-11-04T13:30");
  assert.throws(() => localDateTime("2026-02-30T13:30"));
  assert.throws(() => localDateTime("2026-11-04"));
});
test("all-day editor includes its last selected day across month and leap-year boundaries", () => {
  assert.equal(shiftCalendarDay("2028-02-29", 1), "2028-03-01");
  assert.equal(shiftCalendarDay("2026-12-31", 1), "2027-01-01");
  assert.equal(shiftCalendarDay("2027-01-01", -1), "2026-12-31");
  assert.throws(() => shiftCalendarDay("2026-02-29", 1));
});
