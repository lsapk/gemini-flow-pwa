import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { studentFeedContent, studentFeedUrl } from "@/lib/student-calendar";
import type {
  StudentProfile,
  StudentModule,
  StudentAssessment,
  StudentDeadline,
  StudentCalendarEvent,
} from "@/lib/student";

type Table<Row> = {
  Row: { [Key in keyof Row]: Row[Key] };
  Insert: { [Key in keyof Row]?: Row[Key] };
  Update: { [Key in keyof Row]?: Row[Key] };
  Relationships: [];
};
/** Local generated-type compatibility boundary; regenerate the project Database after migration. */
type StudentDatabase = {
  public: {
    Tables: {
      student_profiles: Table<StudentProfile>;
      student_modules: Table<StudentModule>;
      student_assessments: Table<StudentAssessment>;
      student_deadlines: Table<StudentDeadline>;
      student_calendar_events: Table<StudentCalendarEvent>;
    };
    Views: Record<string, never>;
    Functions: {
      import_student_calendar: {
        Args: {
          p_semester_key: string;
          p_source_key: string;
          p_events: StudentCalendarEvent[];
        };
        Returns: number;
      };
      create_student_revision_task: {
        Args: { p_deadline_id: string; p_title: string; p_due_date: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const db = supabase as unknown as SupabaseClient<StudentDatabase>;
type StudentTable = keyof StudentDatabase["public"]["Tables"];

function fail(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (["42P01", "PGRST205", "PGRST202"].includes(error.code || ""))
    throw new Error(
      "L’espace étudiant n’est pas encore disponible. Réessayez dans un instant ou contactez le support Deepflow.",
    );
  throw new Error(error.message);
}

async function allRows<Row>(request: {
  range(
    from: number,
    to: number,
  ): PromiseLike<{
    data: Row[] | null;
    error: { message: string; code?: string } | null;
  }>;
}) {
  const rows: Row[] = [];
  for (let offset = 0; offset <= 20000; offset += 1000) {
    const { data, error } = await request.range(offset, offset + 999);
    fail(error);
    const batch = data || [];
    if (rows.length + batch.length > 20000) break;
    rows.push(...batch);
    if (batch.length < 1000) return rows;
  }
  throw new Error(
    "Le volume de données dépasse la limite de 20 000 lignes. Réduisez les imports pour continuer.",
  );
}

function modulesFor(userId: string, key?: string) {
  const request = db
    .from("student_modules")
    .select("*")
    .eq("user_id", userId)
    .order("id");
  return allRows(key ? request.eq("semester_key", key) : request);
}
function deadlinesFor(userId: string, key?: string) {
  const request = db
    .from("student_deadlines")
    .select("*")
    .eq("user_id", userId)
    .order("id");
  return allRows(key ? request.eq("semester_key", key) : request);
}
function eventsFor(userId: string, key?: string) {
  const request = db
    .from("student_calendar_events")
    .select("*")
    .eq("user_id", userId)
    .order("id");
  return allRows(key ? request.eq("semester_key", key) : request);
}
function assessmentsFor(userId: string) {
  return allRows(
    db
      .from("student_assessments")
      .select("*")
      .eq("user_id", userId)
      .order("id"),
  );
}
async function linkedTasks(userId: string, deadlines: StudentDeadline[]) {
  const ids = [
    ...new Set(
      deadlines
        .map((item) => item.linked_task_id)
        .filter((id): id is string => !!id),
    ),
  ];
  const batches = [];
  for (let offset = 0; offset < ids.length; offset += 100) {
    batches.push(
      supabase
        .from("tasks")
        .select("id,title,description,priority,completed,due_date")
        .eq("user_id", userId)
        .in("id", ids.slice(offset, offset + 100)),
    );
  }
  const results = await Promise.all(batches);
  return results.flatMap((result) => {
    fail(result.error);
    return result.data || [];
  });
}

export const studentService = {
  async fetchCalendarFeed(url: string) {
    const { data, error } = await supabase.functions.invoke("ical-proxy", {
      body: { url: studentFeedUrl(url) },
    });
    if (error) {
      // Never include the private feed URL or a provider response in diagnostics.
      throw new Error(
        "Impossible de récupérer ce lien. Il doit provenir d’un serveur universitaire autorisé. Réessayez ou importez le fichier .ics.",
      );
    }
    return studentFeedContent(data);
  },
  async getProfile(userId: string) {
    const { data, error } = await db
      .from("student_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    fail(error);
    return data;
  },
  async saveProfile(profile: StudentProfile) {
    const { data, error } = await db
      .from("student_profiles")
      .upsert(profile, { onConflict: "user_id" })
      .select()
      .single();
    fail(error);
    return data;
  },
  async getWorkspace(userId: string, key: string) {
    const [modules, deadlines, events, assessments] = await Promise.all([
      modulesFor(userId, key),
      deadlinesFor(userId, key),
      eventsFor(userId, key),
      assessmentsFor(userId),
    ]);
    const moduleIds = new Set(modules.map((module) => module.id));
    const tasks = await linkedTasks(userId, deadlines);
    return {
      modules,
      deadlines,
      events,
      assessments: assessments.filter((item) => moduleIds.has(item.module_id)),
      tasks,
    };
  },
  async exportAllData(userId: string) {
    const [profile, modules, assessments, deadlines, events] =
      await Promise.all([
        studentService.getProfile(userId),
        modulesFor(userId),
        assessmentsFor(userId),
        deadlinesFor(userId),
        eventsFor(userId),
      ]);
    return {
      format: "deepflow-student-workspace",
      version: 1,
      exported_at: new Date().toISOString(),
      timezone: "Europe/Paris",
      profile,
      modules,
      assessments,
      deadlines,
      calendar_events: events,
      revision_tasks: await linkedTasks(userId, deadlines),
    };
  },
  async saveModule(value: Omit<StudentModule, "id"> & { id?: string }) {
    const { data, error } = await db
      .from("student_modules")
      .upsert(value)
      .select()
      .single();
    fail(error);
    return data;
  },
  async saveAssessment(value: Omit<StudentAssessment, "id"> & { id?: string }) {
    const { data, error } = await db
      .from("student_assessments")
      .upsert(value)
      .select()
      .single();
    fail(error);
    return data;
  },
  async saveDeadline(value: Omit<StudentDeadline, "id"> & { id?: string }) {
    const { data, error } = await db
      .from("student_deadlines")
      .upsert(value)
      .select()
      .single();
    fail(error);
    return data;
  },
  async deleteRow(
    table: Exclude<StudentTable, "student_profiles">,
    id: string,
    userId: string,
  ) {
    const { data, error } = await db
      .from(table)
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id");
    fail(error);
    if (!data?.length)
      throw new Error(
        "Cet élément n’a pas été supprimé. Rechargez la page et réessayez.",
      );
  },
  async importCalendar(
    key: string,
    source: string,
    events: StudentCalendarEvent[],
  ) {
    const { data, error } = await db.rpc("import_student_calendar", {
      p_semester_key: key,
      p_source_key: source.trim(),
      p_events: events,
    });
    fail(error);
    return data;
  },
  async createRevisionTask(deadlineId: string, title: string, dueDate: string) {
    const { data, error } = await db.rpc("create_student_revision_task", {
      p_deadline_id: deadlineId,
      p_title: title.trim(),
      p_due_date: dueDate,
    });
    fail(error);
    return data;
  },
};
