import test from "node:test";
import assert from "node:assert/strict";
import { encodeCsv } from "../src/lib/csv.ts";

test("CSV export preserves separators, quotes and lines within quoted fields", () => {
  assert.equal(
    encodeCsv([
      ["Nom", "Notes"],
      ['Léna, "L"', "A\nB"],
    ]),
    '"Nom","Notes"\r\n"Léna, ""L""","A\nB"',
  );
});
test("CSV export neutralizes formulas even behind whitespace or control prefixes", () => {
  for (const value of [
    "=SUM(A1:A2)",
    "+cmd",
    "-1+1",
    "@remote",
    "  =1",
    "\t=1",
    "\rcommand",
  ]) {
    assert.ok(encodeCsv([[value]]).startsWith("\"'"));
  }
  assert.equal(encodeCsv([[0, null, "Étudiante"]]), '"0","","Étudiante"');
});
