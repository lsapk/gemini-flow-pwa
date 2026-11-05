import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";
const migrationDir = new URL("../supabase/migrations/", import.meta.url);
const migrationName = readdirSync(migrationDir).find((name) =>
  name.includes("student_workspace"),
);
const migration = readFileSync(
  migrationName
    ? new URL(migrationName, migrationDir)
    : new URL("../supabase/student_workspace.sql", import.meta.url),
  "utf8",
);

test("student migration: ownership, task atomicity and version-aware calendar import", async (t) => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role authenticated; create role anon;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated, anon;
      create table public.tasks (
        id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
        title text not null, description text, priority text, due_date timestamptz, completed boolean not null default false
      );
      alter table public.tasks enable row level security;
      create policy task_owner on public.tasks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
      grant select, insert, update, delete on public.tasks to authenticated;
      insert into auth.users values ('${userA}'), ('${userB}');
    `);
    await db.exec(migration);
    const asUser = async (id) => {
      await db.exec("reset role; set role authenticated;");
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
        id,
      ]);
    };
    await asUser(userA);
    const moduleId = (
      await db.query(
        "insert into student_modules(user_id, semester_key, name, ects, coefficient) values ($1, '2026-2027/S1', 'Analyse', 6, 2) returning id",
        [userA],
      )
    ).rows[0].id;
    const deadlineId = (
      await db.query(
        "insert into student_deadlines(user_id,semester_key,title,kind,due_at) values ($1,'2026-2027/S1','Partiel','exam','2026-12-12T09:00:00Z') returning id",
        [userA],
      )
    ).rows[0].id;

    await t.test(
      "owner policies isolate reads/writes and forbid forged ownership",
      async () => {
        await assert.rejects(
          db.query(
            "insert into student_modules(user_id,semester_key,name) values ($1,'2026-2027/S1','Forged')",
            [userB],
          ),
          /row-level security/,
        );
        await asUser(userB);
        assert.equal(
          (await db.query("select * from student_modules")).rows.length,
          0,
        );
        assert.equal(
          (
            await db.query(
              "update student_modules set name='hacked' where id=$1 returning id",
              [moduleId],
            )
          ).rows.length,
          0,
        );
        await assert.rejects(
          db.query(
            "insert into student_assessments(user_id,module_id,title,weight) values ($1,$2,'Cross owner',100)",
            [userB, moduleId],
          ),
          /foreign key/,
        );
        await asUser(userA);
      },
    );
    await t.test(
      "weight trigger rejects overflow and permits a genuine zero grade",
      async () => {
        await db.query(
          "insert into student_assessments(user_id,module_id,title,weight,grade) values ($1,$2,'CC',60,0)",
          [userA, moduleId],
        );
        await assert.rejects(
          db.query(
            "insert into student_assessments(user_id,module_id,title,weight) values ($1,$2,'Final',50)",
            [userA, moduleId],
          ),
          /100/,
        );
        await db.query(
          "insert into student_assessments(user_id,module_id,title,weight) values ($1,$2,'Final',40)",
          [userA, moduleId],
        );
        assert.equal(
          (
            await db.query(
              "select sum(weight) as total from student_assessments",
            )
          ).rows[0].total,
          "100.00",
        );
      },
    );
    await t.test(
      "revision bridge is idempotent, respects ownership and keeps existing task integration",
      async () => {
        const create = () =>
          db.query(
            "select create_student_revision_task($1,'Réviser le partiel','2026-12-10') as id",
            [deadlineId],
          );
        const taskId = (await create()).rows[0].id;
        assert.equal((await create()).rows[0].id, taskId);
        assert.equal((await db.query("select * from tasks")).rows.length, 1);
        await asUser(userB);
        await assert.rejects(create(), /introuvable/);
        await assert.rejects(
          db.query(
            "insert into student_deadlines(user_id,semester_key,title,kind,due_at,linked_task_id) values ($1,'2026-2027/S1','Forged link','exam',now(),$2)",
            [userB, taskId],
          ),
          /row-level security/,
        );
        await asUser(userA);
        await db.query("delete from tasks where id=$1", [taskId]);
        assert.equal(
          (
            await db.query(
              "select linked_task_id from student_deadlines where id=$1",
              [deadlineId],
            )
          ).rows[0].linked_task_id,
          null,
        );
      },
    );

    const item = (overrides = {}) => ({
      uid: "course",
      recurrence_id: "",
      title: "Analyse",
      location: "A",
      description: "",
      starts_at: "2026-11-03T08:00:00Z",
      ends_at: "2026-11-03T10:00:00Z",
      all_day: false,
      status: "confirmed",
      sequence: 2,
      version_at: "2026-11-01T12:00:00Z",
      ...overrides,
    });
    const importEvents = (events) =>
      db.query(
        "select import_student_calendar('2026-2027/S1','Groupe A',$1::jsonb)",
        [JSON.stringify(events)],
      );
    await t.test(
      "repeated imports do not duplicate or overwrite a newer version",
      async () => {
        await importEvents([item()]);
        await importEvents([item()]);
        await importEvents([item({ sequence: 1, title: "Ancienne version" })]);
        assert.equal(
          (await db.query("select * from student_calendar_events")).rows.length,
          1,
        );
        assert.equal(
          (await db.query("select title from student_calendar_events")).rows[0]
            .title,
          "Analyse",
        );
      },
    );
    await t.test(
      "UID cancellations include detached occurrences and block stale resurrection",
      async () => {
        await importEvents([
          item({ uid: "series", recurrence_id: "2026-11-03T08:00:00.000Z" }),
          item({ uid: "series", recurrence_id: "2026-11-10T08:00:00.000Z" }),
        ]);
        await importEvents([
          item({
            uid: "series",
            status: "cancelled",
            starts_at: null,
            ends_at: null,
            sequence: 3,
          }),
        ]);
        await importEvents([
          item({ uid: "series", recurrence_id: "2026-11-17T08:00:00.000Z" }),
        ]);
        assert.equal(
          (
            await db.query(
              "select * from student_calendar_events where uid='series' and status <> 'cancelled'",
            )
          ).rows.length,
          0,
        );
        await importEvents([
          item({
            uid: "series",
            recurrence_id: "2026-11-17T08:00:00.000Z",
            sequence: 4,
          }),
        ]);
        assert.equal(
          (
            await db.query(
              "select * from student_calendar_events where uid='series' and status='confirmed'",
            )
          ).rows.length,
          1,
        );
      },
    );
    await t.test(
      "invalid batch rolls back every event, and anonymous calls are denied",
      async () => {
        await assert.rejects(
          importEvents([item({ uid: "must-rollback" }), item({ uid: "" })]),
        );
        assert.equal(
          (
            await db.query(
              "select * from student_calendar_events where uid='must-rollback'",
            )
          ).rows.length,
          0,
        );
        await asUser(userB);
        assert.equal(
          (await db.query("select * from student_calendar_events")).rows.length,
          0,
        );
        await db.exec("reset role; set role anon;");
        await assert.rejects(importEvents([item()]), /permission denied/);
        await assert.rejects(
          db.query("select * from student_calendar_events"),
          /permission denied/,
        );
      },
    );
  } finally {
    await db.close();
  }
});
