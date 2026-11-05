import test from "node:test";
import assert from "node:assert/strict";
import {
  moduleResult,
  semesterResult,
  parisWallTime,
  toParisInput,
} from "../src/lib/student.ts";
import {
  parseStudentCalendar,
  MAX_ICS_BYTES,
  studentFeedUrl,
  studentFeedContent,
} from "../src/lib/student-calendar.ts";

const calendar = (...events) =>
  ["BEGIN:VCALENDAR", "VERSION:2.0", ...events, "END:VCALENDAR"].join("\r\n");
const event = (extra = [], uid = "course-1") =>
  [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    "DTSTART;TZID=Europe/Paris:20261103T090000",
    "DTEND;TZID=Europe/Paris:20261103T110000",
    "SUMMARY:Analyse",
    ...extra,
    "END:VEVENT",
  ].join("\r\n");

test("private feed URLs allow HTTPS and refuse credentials, fragments and custom ports", () => {
  assert.equal(
    studentFeedUrl("  https://edt.univ-lyon1.fr/export?token=private  "),
    "https://edt.univ-lyon1.fr/export?token=private",
  );
  for (const value of [
    "http://edt.univ-lyon1.fr/feed",
    "file:///etc/passwd",
    "https://user:pass@edt.univ-lyon1.fr/feed",
    "https://edt.univ-lyon1.fr/feed#secret",
    "https://edt.univ-lyon1.fr:8443/feed",
    "not-a-url",
    `https://edt.univ-lyon1.fr/${"x".repeat(4096)}`,
  ])
    assert.throws(() => studentFeedUrl(value));
});

test("feed response must be bounded UTF-8 content and is parsed before import", () => {
  const content = calendar(event());
  assert.equal(
    parseStudentCalendar(studentFeedContent({ content })).events.length,
    1,
  );
  for (const value of [
    null,
    "BEGIN:VCALENDAR",
    {},
    { content: 42 },
    { content: "é".repeat(MAX_ICS_BYTES / 2 + 1) },
  ])
    assert.throws(() => studentFeedContent(value));
  assert.throws(() =>
    parseStudentCalendar(
      studentFeedContent({ content: "<html>Sign in</html>" }),
    ),
  );
});

test("French weighted averages preserve zero and exclude missing grades", () => {
  const result = moduleResult([
    { grade: 0, weight: 25 },
    { grade: 16, weight: 25 },
    { grade: null, weight: 50 },
  ]);
  assert.equal(result.mean, 8);
  assert.equal(result.gradedWeight, 50);
  assert.equal(result.complete, false);
  assert.equal(moduleResult([{ grade: null, weight: 100 }]).mean, null);
});
test("semester averages use UE coefficients rather than ECTS; completion stays explicit", () => {
  const modules = [
    { id: "a", coefficient: 2, ects: 6 },
    { id: "b", coefficient: 1, ects: 12 },
    { id: "c", coefficient: 3, ects: 3 },
  ];
  const result = semesterResult(modules, [
    { module_id: "a", grade: 10, weight: 100 },
    { module_id: "b", grade: 16, weight: 100 },
  ]);
  assert.equal(result.mean, 12);
  assert.equal(result.ects, 21);
  assert.equal(result.complete, false);
});
test("Paris wall time is independent of device timezone and respects summer time", () => {
  assert.equal(parisWallTime("2026-11-03T09:00"), "2026-11-03T08:00:00.000Z");
  assert.equal(parisWallTime("2026-07-03T09:00"), "2026-07-03T07:00:00.000Z");
  assert.equal(toParisInput("2026-11-03T08:00:00Z"), "2026-11-03T09:00");
});
test("invalid and ambiguous Paris times are rejected", () => {
  for (const value of [
    "2026-02-30T09:00",
    "2026-03-29T02:30",
    "2026-10-25T02:30",
    "bad",
  ])
    assert.throws(() => parisWallTime(value));
});
test("ICS Paris timestamps and escaped/folded text", () => {
  const parsed = parseStudentCalendar(
    calendar(
      event([
        "LOCATION:Salle A\\, bâtiment B",
        "DESCRIPTION:Première ligne\\nDeuxième",
        " ligne",
      ]),
    ),
  );
  assert.equal(parsed.events[0].starts_at, "2026-11-03T08:00:00.000Z");
  assert.equal(parsed.events[0].location, "Salle A, bâtiment B");
  assert.equal(parsed.events[0].description, "Première ligne\nDeuxièmeligne");
});
test("ICS UTC and floating dates", () => {
  const parsed = parseStudentCalendar(
    calendar(
      event()
        .replaceAll(";TZID=Europe/Paris", "")
        .replaceAll("T090000", "T090000Z")
        .replaceAll("T110000", "T110000Z"),
      event([], "floating").replaceAll(";TZID=Europe/Paris", ""),
    ),
  );
  assert.equal(parsed.events[1].starts_at, "2026-11-03T09:00:00.000Z");
  assert.ok(parsed.warnings.some((item) => item.includes("sans fuseau")));
});
test("quotes and colons in text values are preserved, quoted TZID parameters work", () => {
  const parsed = parseStudentCalendar(
    calendar(
      event([
        'DESCRIPTION:Lire la page : https://example.org/ et le texte "citation',
      ])
        .replace("SUMMARY:Analyse", 'SUMMARY:Cours : "Introduction')
        .replaceAll("TZID=Europe/Paris", 'TZID="Europe/Paris"'),
    ),
  );
  assert.equal(parsed.events[0].title, 'Cours : "Introduction');
  assert.equal(
    parsed.events[0].description,
    'Lire la page : https://example.org/ et le texte "citation',
  );
});
test("all-day end remains exclusive across Paris DST", () => {
  const parsed = parseStudentCalendar(
    calendar(
      "BEGIN:VEVENT\r\nUID:day\r\nDTSTART;VALUE=DATE:20260329\r\nSUMMARY:Repos\r\nEND:VEVENT",
    ),
  );
  assert.equal(parsed.events[0].starts_at, "2026-03-28T23:00:00.000Z");
  assert.equal(parsed.events[0].ends_at, "2026-03-29T22:00:00.000Z");
  assert.equal(parsed.events[0].all_day, true);
});
test("duplicates retain greatest sequence, then latest version", () => {
  const parsed = parseStudentCalendar(
    calendar(
      event(["SEQUENCE:2", "DTSTAMP:20261101T100000Z"]),
      event(["SEQUENCE:1", "DTSTAMP:20261102T100000Z"]),
      event(["SEQUENCE:2", "DTSTAMP:20261102T100000Z"]),
    ),
  );
  assert.equal(parsed.events.length, 1);
  assert.equal(parsed.duplicateCount, 2);
  assert.equal(parsed.events[0].sequence, 2);
  assert.equal(parsed.events[0].version_at, "2026-11-02T10:00:00.000Z");
});
test("detached RECURRENCE-ID occurrences have independent identities", () => {
  const parsed = parseStudentCalendar(
    calendar(
      event(["RECURRENCE-ID:20261103T080000Z"]),
      event(["RECURRENCE-ID:20261110T080000Z"]),
    ),
  );
  assert.equal(parsed.events.length, 2);
});
test("cancellations need UID but may omit DTSTART", () => {
  const parsed = parseStudentCalendar(
    calendar("BEGIN:VEVENT\r\nUID:cancel\r\nSTATUS:CANCELLED\r\nEND:VEVENT"),
  );
  assert.equal(parsed.events[0].status, "cancelled");
  assert.equal(parsed.events[0].starts_at, null);
  const method = parseStudentCalendar(
    calendar("METHOD:CANCEL", "BEGIN:VEVENT\r\nUID:cancel\r\nEND:VEVENT"),
  );
  assert.equal(method.events[0].status, "cancelled");
});
test("recurrences are rejected atomically with an actionable message", () => {
  for (const recurrence of [
    "RRULE:FREQ=WEEKLY;COUNT=5",
    "RDATE:20261110T080000Z",
    "EXDATE:20261110T080000Z",
    "EXRULE:FREQ=DAILY",
  ])
    assert.throws(
      () =>
        parseStudentCalendar(calendar(event([], "good"), event([recurrence]))),
      /Récurrence non prise en charge/,
    );
});
test("unsupported timezone/duration/future-range fail rather than losing information", () => {
  assert.throws(
    () =>
      parseStudentCalendar(
        calendar(event().replaceAll("Europe/Paris", "America/New_York")),
      ),
    /Fuseau/,
  );
  assert.throws(
    () => parseStudentCalendar(calendar(event(["DURATION:PT2H"]))),
    /DURATION/,
  );
  assert.throws(
    () =>
      parseStudentCalendar(
        calendar(event(["RECURRENCE-ID;RANGE=THISANDFUTURE:20261103T080000Z"])),
      ),
    /THISANDFUTURE/,
  );
});
test("missing identifiers, malformed structures and dates fail explicitly", () => {
  for (const value of [
    "<html>login</html>",
    calendar(event().replace("UID:course-1\r\n", "")),
    calendar(event().replace("20261103T090000", "20260230T090000")),
    calendar(event().replace("END:VEVENT", "END:VTODO")),
    calendar(event(["DTSTART:20261103T080000Z"])),
  ])
    assert.throws(() => parseStudentCalendar(value));
});
test("file/event bounds prevent unbounded import", () => {
  assert.throws(
    () => parseStudentCalendar("x".repeat(MAX_ICS_BYTES + 1)),
    /volumineux/,
  );
  assert.throws(
    () =>
      parseStudentCalendar(
        calendar(
          ...Array.from({ length: 2001 }, (_, index) =>
            event([], String(index)),
          ),
        ),
      ),
    /Trop d’événements/,
  );
});
test("embedded alarms do not become courses or override parent course data", () => {
  const parsed = parseStudentCalendar(
    calendar(
      event([
        "BEGIN:VALARM",
        "DESCRIPTION:Alarm",
        "TRIGGER:-PT5M",
        "END:VALARM",
      ]),
    ),
  );
  assert.equal(parsed.events.length, 1);
  assert.equal(parsed.events[0].description, "");
});
