import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
await db.exec(`
  create role anon; create role authenticated; create role service_role bypassrls;
  create schema auth;
  create table auth.users(id uuid primary key,email text);
  create table public.tasks(id uuid primary key default gen_random_uuid(),user_id uuid not null,title text not null,description text,due_date timestamptz,completed boolean not null default false,priority text,updated_at timestamptz default now());
  alter table public.tasks enable row level security;
`);
await db.exec(
  await readFile(
    new URL(
      "../supabase/migrations/20261103202446_google_connections.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
test.after(async () => {
  await db.close();
});

test("real Google SQL enforces single-use OAuth, user-bound confirmation, ownership, locks and idempotent task import", async () => {
  await db.exec(
    await readFile(
      new URL("../supabase/tests/google-integration.sql", import.meta.url),
      "utf8",
    ),
  );
});

test("anon and authenticated cannot execute private facade or select encrypted OAuth material", async () => {
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`set role ${role}`);
    try {
      await assert.rejects(
        db.query(`select public.google_store('connection_get',null)`),
        /permission denied/,
      );
      await assert.rejects(
        db.query(`select * from google_private.connections`),
        /permission denied/,
      );
    } finally {
      await db.exec("reset role");
    }
  }
  await db.exec("set role service_role");
  try {
    assert.equal(
      (
        await db.query(
          `select public.google_store('connection_get','f1000000-0000-4000-8000-000000000001') connection`,
        )
      ).rows[0].connection,
      null,
    );
    await assert.rejects(
      db.query(`select * from google_private.connections`),
      /permission denied/,
    );
  } finally {
    await db.exec("reset role");
  }
});
