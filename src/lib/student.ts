/** User-entered planning data. Calculations never determine an official result. */
export interface StudentProfile {
  user_id: string;
  institution: string;
  degree: string;
  study_year: string;
  academic_year: string;
  semester: number;
}

export interface StudentModule {
  id: string;
  user_id: string;
  semester_key: string;
  name: string;
  code: string;
  ects: number;
  coefficient: number;
}

export interface StudentAssessment {
  id: string;
  user_id: string;
  module_id: string;
  title: string;
  weight: number;
  grade: number | null;
}

export interface StudentDeadline {
  id: string;
  user_id: string;
  semester_key: string;
  title: string;
  kind: "exam" | "assignment" | "administrative";
  due_at: string;
  location: string;
  notes: string;
  completed: boolean;
  linked_task_id: string | null;
}

export interface StudentCalendarEvent {
  id?: string;
  user_id?: string;
  semester_key?: string;
  source_key?: string;
  uid: string;
  recurrence_id: string;
  title: string;
  location: string;
  description: string;
  starts_at: string | null;
  ends_at: string | null;
  all_day: boolean;
  status: "confirmed" | "cancelled";
  sequence: number;
  version_at: string;
}

export const semesterKey = (profile: StudentProfile) =>
  `${profile.academic_year}/S${profile.semester}`;

export function defaultStudentProfile(userId: string): StudentProfile {
  const now = new Date();
  const startYear =
    now.getMonth() < 7 ? now.getFullYear() - 1 : now.getFullYear();
  return {
    user_id: userId,
    institution: "",
    degree: "",
    study_year: "",
    academic_year: `${startYear}-${startYear + 1}`,
    semester: 1,
  };
}

export function moduleResult(
  assessments: Pick<StudentAssessment, "grade" | "weight">[],
) {
  const totalWeight = assessments.reduce((sum, item) => sum + item.weight, 0);
  const graded = assessments.filter((item) => item.grade !== null);
  const gradedWeight = graded.reduce((sum, item) => sum + item.weight, 0);
  const mean =
    gradedWeight > 0
      ? graded.reduce((sum, item) => sum + item.grade! * item.weight, 0) /
        gradedWeight
      : null;
  return {
    mean,
    totalWeight,
    gradedWeight,
    complete:
      Math.abs(totalWeight - 100) < 0.001 &&
      Math.abs(gradedWeight - 100) < 0.001,
  };
}

export function semesterResult(
  modules: StudentModule[],
  assessments: StudentAssessment[],
) {
  const results = modules.map((module) => ({
    module,
    result: moduleResult(
      assessments.filter((item) => item.module_id === module.id),
    ),
  }));
  const graded = results.filter((item) => item.result.mean !== null);
  const coefficients = graded.reduce(
    (sum, item) => sum + item.module.coefficient,
    0,
  );
  return {
    mean: coefficients
      ? graded.reduce(
          (sum, item) => sum + item.result.mean! * item.module.coefficient,
          0,
        ) / coefficients
      : null,
    ects: modules.reduce((sum, module) => sum + module.ects, 0),
    gradedModules: graded.length,
    complete:
      modules.length > 0 && results.every((item) => item.result.complete),
  };
}

export const formatGrade = (value: number | null) =>
  value === null
    ? "—"
    : value.toLocaleString("fr-FR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      });

export function formatStudentDate(value: string, allDay = false) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(allDay ? {} : { hour: "2-digit", minute: "2-digit" }),
  }).format(new Date(value));
}

/** Converts a datetime-local input to a Paris instant, independent of device zone. */
export function parisWallTime(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    value,
  );
  if (!match)
    throw new Error("Date invalide. Utilisez une date et une heure complètes.");
  const [, y, m, d, h, min, sec = "00"] = match;
  const parts = [y, m, d, h, min, sec].map(Number);
  const utc = Date.UTC(
    parts[0],
    parts[1] - 1,
    parts[2],
    parts[3],
    parts[4],
    parts[5],
  );
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const candidates = [utc - 3600000, utc - 7200000, utc - 0].filter(
    (instant) => {
      const p = Object.fromEntries(
        formatter.formatToParts(instant).map((item) => [item.type, item.value]),
      );
      return (
        [p.year, p.month, p.day, p.hour, p.minute, p.second].join("") ===
        [y, m, d, h, min, sec].join("")
      );
    },
  );
  if (candidates.length !== 1)
    throw new Error(
      "Heure inexistante ou ambiguë lors du changement d’heure à Paris. Choisissez une autre heure ou un export ICS en UTC (Z).",
    );
  return new Date(candidates[0]).toISOString();
}

export function toParisInput(value: string) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
  return parts.replace(" ", "T");
}
