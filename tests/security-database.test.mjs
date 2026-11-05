import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";
const bobGoal = "33333333-3333-4333-8333-333333333333";
const db = new PGlite();
await db.exec(`
  create role anon; create role authenticated; create role service_role bypassrls;
  create schema auth;
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  grant usage on schema auth to public; grant execute on function auth.uid() to public;
  create table auth.users(id uuid primary key,email text);
  insert into auth.users values ('${alice}','alice@example.com'),('${bob}','bob@example.com');
  create type public.app_role as enum ('admin','moderator','user','creator');
  create table public.user_roles(id uuid primary key default gen_random_uuid(),user_id uuid,role public.app_role,created_at timestamptz default now());
  create table public.subscribers(id uuid default gen_random_uuid(),user_id uuid unique,email text unique not null,stripe_customer_id text,subscribed boolean not null default false,subscription_tier text,subscription_end timestamptz,created_at timestamptz default now(),updated_at timestamptz default now());
  create table public.subscription_history(id uuid default gen_random_uuid(),user_id uuid,product_id text,purchase_token text);
  create table public.ai_requests(id uuid default gen_random_uuid(),user_id uuid not null,service text not null,created_at timestamptz default now());
  create table public.goals(id uuid primary key default gen_random_uuid(),user_id uuid not null,title text not null,description text,category text,completed boolean default false,progress numeric,target_date timestamptz,sort_order integer,is_archived boolean,offline_id text unique,created_at timestamptz default now(),updated_at timestamptz default now(),synced_at timestamptz);
  create table public.tasks(id uuid primary key default gen_random_uuid(),user_id uuid not null,title text not null,description text,completed boolean default false,due_date timestamptz,priority text,sort_order integer,linked_goal_id uuid references public.goals(id),parent_task_id uuid references public.tasks(id),offline_id text unique,created_at timestamptz default now(),updated_at timestamptz default now(),synced_at timestamptz);
  create table public.habits(id uuid primary key default gen_random_uuid(),user_id uuid not null,title text not null,frequency text not null,target integer not null,description text,category text,streak integer,last_completed_at timestamptz,sort_order integer,is_archived boolean,linked_goal_id uuid references public.goals(id),offline_id text unique,created_at timestamptz default now(),updated_at timestamptz default now(),synced_at timestamptz);
  create table public.journal_entries(id uuid primary key default gen_random_uuid(),user_id uuid not null,title text not null,content text not null,mood text,tags jsonb,offline_id text unique,created_at timestamptz default now(),updated_at timestamptz default now(),synced_at timestamptz);
  create table public.focus_sessions(id uuid primary key default gen_random_uuid(),user_id uuid not null,title text,duration integer not null,started_at timestamptz,completed_at timestamptz,offline_id text unique,created_at timestamptz default now(),updated_at timestamptz default now(),synced_at timestamptz);
  create table public.subtasks(id uuid primary key default gen_random_uuid(),user_id uuid not null,parent_task_id uuid references public.tasks(id),title text);
  create table public.credentials_entity(id text primary key,data text);
  insert into public.credentials_entity values ('secret','private-token');
  insert into public.goals(id,user_id,title) values ('${bobGoal}','${bob}','Bob private goal');
  insert into public.user_roles(user_id,role) values ('${bob}','admin');
  insert into public.subscribers(user_id,email,subscribed,subscription_tier,subscription_end,stripe_customer_id) values ('${alice}','alice@example.com',true,'ultimate',now()+interval '1 year','cus_alice'),('${bob}','bob@example.com',false,null,null,'cus_bob');
  create view public.goal_summary as select * from public.goals;
  create materialized view public.secret_snapshot as select * from public.credentials_entity;
  create function public.dump_credentials() returns text language sql security definer as $$ select data from public.credentials_entity limit 1 $$;
  grant all on all tables in schema public to anon,authenticated,service_role;
`);
const files = await readdir(
  new URL("../supabase/migrations/", import.meta.url),
);
const hardening = files.find((name) =>
  name.endsWith("_harden_backend_and_ai_credits.sql"),
);
assert.ok(hardening, "CLI-created security migration must exist");
const migration = await readFile(
  new URL(`../supabase/migrations/${hardening}`, import.meta.url),
  "utf8",
);
await db.exec(migration);
test.after(async () => {
  await db.close();
});

async function as(role, identity, fn) {
  await db.exec(`set role ${role}`);
  await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [
    identity ?? "",
  ]);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}
const sql = (query, args = []) => db.query(query, args);

test("all public base tables have RLS and automation-engine credentials have no web grants", async () => {
  assert.equal(
    (
      await sql(
        `select count(*)::integer n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity`,
      )
    ).rows[0].n,
    0,
  );
  await assert.rejects(
    as("anon", null, () => sql("select * from public.credentials_entity")),
    /permission denied/,
  );
  await assert.rejects(
    as("authenticated", alice, () =>
      sql("select * from public.credentials_entity"),
    ),
    /permission denied/,
  );
  await assert.rejects(
    as("authenticated", alice, () =>
      sql("select * from public.secret_snapshot"),
    ),
    /permission denied/,
  );
  await assert.rejects(
    as("authenticated", alice, () => sql("select public.dump_credentials()")),
    /permission denied/,
  );
  assert.equal(
    (
      await as("authenticated", alice, () =>
        sql("select * from public.goal_summary"),
      )
    ).rows.length,
    0,
  );
  assert.equal(
    (await sql("select data from public.credentials_entity")).rows[0].data,
    "private-token",
  );
});

test("web users cannot grant roles, forge entitlements, insert usage or call admin/credit RPCs", async () => {
  for (const query of [
    `insert into public.user_roles(user_id,role) values ('${alice}','admin')`,
    `update public.subscribers set subscribed=true,subscription_tier='ultimate' where user_id='${alice}'`,
    `insert into public.ai_requests(user_id,service) values ('${alice}','chat')`,
    `select public.setup_admin_user()`,
    `select public.reserve_ai_credit('${alice}','chat')`,
    `select public.finish_ai_credit(gen_random_uuid(),false)`,
  ])
    await assert.rejects(
      as("authenticated", alice, () => sql(query)),
      /permission denied/,
    );
  assert.equal(
    (
      await as("authenticated", alice, () =>
        sql("select * from public.user_roles"),
      )
    ).rows.length,
    0,
  );
  assert.equal(
    (await sql("select count(*)::integer n from public.user_roles")).rows[0].n,
    1,
  );
});

test("RLS prevents reading and reassigning another owner and rejects foreign parents", async () => {
  assert.equal(
    (await as("authenticated", alice, () => sql("select * from public.goals")))
      .rows.length,
    0,
  );
  await as("authenticated", alice, () =>
    sql(
      `insert into public.tasks(user_id,title,offline_id) values ($1,'Alice task','alice-test')`,
      [alice],
    ),
  );
  await assert.rejects(
    as("authenticated", alice, () =>
      sql(`update public.tasks set user_id=$1 where offline_id='alice-test'`, [
        bob,
      ]),
    ),
    /row-level security/,
  );
  await assert.rejects(
    as("authenticated", alice, () =>
      sql(
        `insert into public.tasks(user_id,title,linked_goal_id) values ($1,'Foreign goal',$2)`,
        [alice, bobGoal],
      ),
    ),
    /ownership mismatch/,
  );
});

test("sync validates owner, table and editable fields, while safely inserting and merging own records", async () => {
  const sync = (table, owner, offline, item) =>
    as("authenticated", alice, () =>
      sql("select public.sync_offline_item($1,$2,$3,$4::jsonb) id", [
        table,
        owner,
        offline,
        JSON.stringify(item),
      ]),
    );
  await assert.rejects(
    sync("goals", bob, "forged", { title: "bad" }),
    /Identity mismatch/,
  );
  await assert.rejects(
    sync("user_roles", alice, "forged", { role: "admin" }),
    /Invalid sync table/,
  );
  await assert.rejects(
    sync("tasks; drop table public.goals;--", alice, "forged", {
      title: "bad",
    }),
    /Invalid sync table/,
  );
  await assert.rejects(
    sync("tasks", alice, "forged", { "title) values (null); --": "bad" }),
    /Invalid sync field/,
  );
  await assert.rejects(
    sync("tasks", alice, "forged", { title: "bad", user_id: bob }),
    /Ownership mismatch/,
  );
  const first = (
    await sync("tasks", alice, "offline-safe", {
      title: "First",
      priority: "high",
    })
  ).rows[0].id;
  const second = (
    await sync("tasks", alice, "offline-safe", { title: "Updated ' safely" })
  ).rows[0].id;
  assert.equal(first, second);
  assert.equal(
    (
      await sql("select title,priority,user_id from public.tasks where id=$1", [
        first,
      ])
    ).rows[0].title,
    "Updated ' safely",
  );
  assert.equal(
    (await sql("select priority from public.tasks where id=$1", [first]))
      .rows[0].priority,
    "high",
  );
});

test("unverified historical premium does not bypass five daily credits; refund is idempotent", async () => {
  const reserve = () =>
    as("service_role", null, () =>
      sql(`select public.reserve_ai_credit($1,'chat') usage`, [alice]),
    );
  const usage = (
    await as("authenticated", alice, () =>
      sql("select public.get_ai_usage() usage"),
    )
  ).rows[0].usage;
  assert.equal(usage.tier, "free");
  assert.equal(usage.daily_limit, 5);
  const reservations = [];
  for (let i = 0; i < 5; i++)
    reservations.push((await reserve()).rows[0].usage);
  assert.ok(reservations.every((value) => value.allowed));
  assert.equal((await reserve()).rows[0].usage.allowed, false);
  await as("service_role", null, () =>
    sql("select public.finish_ai_credit($1,false)", [
      reservations[0].reservation_id,
    ]),
  );
  await as("service_role", null, () =>
    sql("select public.finish_ai_credit($1,false)", [
      reservations[0].reservation_id,
    ]),
  );
  assert.equal((await reserve()).rows[0].usage.allowed, true);
  assert.equal((await reserve()).rows[0].usage.allowed, false);
  await as("service_role", null, () =>
    sql("select public.finish_ai_credit($1,true)", [
      reservations[1].reservation_id,
    ]),
  );
  await as("service_role", null, () =>
    sql("select public.finish_ai_credit($1,false)", [
      reservations[1].reservation_id,
    ]),
  );
  assert.equal(
    (
      await sql("select status from public.ai_credit_usage where id=$1", [
        reservations[1].reservation_id,
      ])
    ).rows[0].status,
    "succeeded",
  );
  assert.equal(
    (await sql("select count(*)::integer n from public.ai_requests")).rows[0].n,
    1,
  );
});

test("verified Stripe writes bind customer, ignore replay/old events, and determine premium quotas", async () => {
  const apply = (event, created, customer, active, tier) =>
    as("service_role", null, () =>
      sql(
        `select public.apply_stripe_subscription($1,$2,$3,$4,'sub_alice',$5,$6,now()+interval '1 day')`,
        [event, created, alice, customer, active, tier],
      ),
    );
  await assert.rejects(
    apply("evt_wrong", 1, "cus_bob", true, "ultimate"),
    /ownership mismatch/,
  );
  await apply("evt_valid", 10, "cus_alice", true, "premium");
  await apply("evt_valid", 10, "cus_alice", false, null);
  await apply("evt_older", 9, "cus_alice", false, null);
  const usage = (
    await as("authenticated", alice, () =>
      sql("select public.get_ai_usage() usage"),
    )
  ).rows[0].usage;
  assert.equal(usage.tier, "premium");
  assert.equal(usage.daily_limit, 200);
  await apply("evt_cancel", 11, "cus_alice", false, null);
  assert.equal(
    (
      await as("authenticated", alice, () =>
        sql("select public.get_ai_usage() usage"),
      )
    ).rows[0].usage.tier,
    "free",
  );
});
