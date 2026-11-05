-- Student-owned planning records and transactional calendar/revision bridges.
create table public.student_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  institution text not null check (length(btrim(institution)) between 1 and 200),
  degree text not null check (length(btrim(degree)) between 1 and 200),
  study_year text not null check (length(btrim(study_year)) between 1 and 60),
  academic_year text not null check (academic_year ~ '^[0-9]{4}-[0-9]{4}$' and substring(academic_year, 6, 4)::integer = substring(academic_year, 1, 4)::integer + 1),
  semester smallint not null check (semester between 1 and 12)
);

create table public.student_modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  semester_key text not null check (semester_key ~ '^[0-9]{4}-[0-9]{4}/S([1-9]|1[0-2])$'),
  name text not null check (length(btrim(name)) between 1 and 200),
  code text not null default '' check (length(code) <= 50),
  ects numeric(5,2) not null default 0 check (ects between 0 and 60),
  coefficient numeric(7,2) not null default 1 check (coefficient > 0 and coefficient <= 1000),
  unique (id, user_id)
);
create index student_modules_owner_semester on public.student_modules(user_id, semester_key);

create table public.student_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null,
  title text not null check (length(btrim(title)) between 1 and 200),
  weight numeric(5,2) not null check (weight > 0 and weight <= 100),
  grade numeric(4,2) check (grade between 0 and 20),
  foreign key (module_id, user_id) references public.student_modules(id, user_id) on delete cascade
);
create index student_assessments_owner_module on public.student_assessments(user_id, module_id);

create table public.student_deadlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  semester_key text not null check (semester_key ~ '^[0-9]{4}-[0-9]{4}/S([1-9]|1[0-2])$'),
  title text not null check (length(btrim(title)) between 1 and 200),
  kind text not null check (kind in ('exam', 'assignment', 'administrative')),
  due_at timestamptz not null,
  location text not null default '' check (length(location) <= 500),
  notes text not null default '' check (length(notes) <= 5000),
  completed boolean not null default false,
  linked_task_id uuid references public.tasks(id) on delete set null
);
create index student_deadlines_owner_semester on public.student_deadlines(user_id, semester_key, due_at);
create index student_deadlines_linked_task on public.student_deadlines(linked_task_id);

create table public.student_calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  semester_key text not null check (semester_key ~ '^[0-9]{4}-[0-9]{4}/S([1-9]|1[0-2])$'),
  source_key text not null check (length(btrim(source_key)) between 1 and 120),
  uid text not null check (length(btrim(uid)) between 1 and 500 and octet_length(uid) <= 1500),
  recurrence_id text not null default '' check (length(recurrence_id) <= 100),
  title text not null check (length(title) <= 300),
  location text not null default '' check (length(location) <= 500),
  description text not null default '' check (length(description) <= 10000),
  starts_at timestamptz,
  ends_at timestamptz,
  all_day boolean not null default false,
  status text not null check (status in ('confirmed', 'cancelled')),
  sequence integer not null default 0 check (sequence >= 0),
  version_at timestamptz not null default '1970-01-01T00:00:00Z',
  check (status = 'cancelled' or (starts_at is not null and ends_at is not null and ends_at >= starts_at)),
  unique (user_id, semester_key, source_key, uid, recurrence_id)
);
create index student_calendar_owner_start on public.student_calendar_events(user_id, semester_key, starts_at);

alter table public.student_profiles enable row level security;
alter table public.student_modules enable row level security;
alter table public.student_assessments enable row level security;
alter table public.student_deadlines enable row level security;
alter table public.student_calendar_events enable row level security;

-- Both predicates protect UPDATE as well as the INSERT and DELETE cases.
create policy student_profiles_owner on public.student_profiles for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy student_modules_owner on public.student_modules for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy student_assessments_owner on public.student_assessments for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy student_calendar_owner on public.student_calendar_events for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy student_deadlines_owner on public.student_deadlines for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and (linked_task_id is null or exists (select 1 from public.tasks task where task.id = linked_task_id and task.user_id = (select auth.uid()))));

revoke all on public.student_profiles, public.student_modules, public.student_assessments, public.student_deadlines, public.student_calendar_events from public, anon;
grant select, insert, update, delete on public.student_profiles, public.student_modules, public.student_assessments, public.student_deadlines, public.student_calendar_events to authenticated;

-- Serializes concurrent changes to an UE so assessment weights cannot exceed 100%.
create function public.check_student_assessment_weights() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare total numeric;
begin
  perform 1 from public.student_modules where id = new.module_id and user_id = new.user_id for update;
  select coalesce(sum(weight), 0) into total from public.student_assessments where module_id = new.module_id and user_id = new.user_id and id <> new.id;
  if total + new.weight > 100 then raise exception 'Les pondérations des évaluations ne peuvent pas dépasser 100 %%.'; end if;
  return new;
end;
$$;
revoke all on function public.check_student_assessment_weights() from public, anon, authenticated;
create trigger student_assessment_weights before insert or update on public.student_assessments for each row execute function public.check_student_assessment_weights();

-- Transactional, idempotent bridge to the existing task workflow; preserves its RLS.
create function public.create_student_revision_task(p_deadline_id uuid, p_title text, p_due_date date) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare deadline public.student_deadlines; task_id uuid; owner uuid := auth.uid();
begin
  if owner is null then raise exception 'Authentification requise.'; end if;
  if p_title is null or length(btrim(p_title)) not between 1 and 250 or p_due_date is null then raise exception 'Intitulé et date de révision requis.'; end if;
  select * into deadline from public.student_deadlines where id = p_deadline_id and user_id = owner for update;
  if not found then raise exception 'Échéance introuvable.'; end if;
  if p_due_date > (deadline.due_at at time zone 'Europe/Paris')::date then raise exception 'La révision doit précéder l’échéance.'; end if;
  if deadline.linked_task_id is not null then return deadline.linked_task_id; end if;
  insert into public.tasks(user_id, title, description, priority, due_date, completed)
    values (owner, btrim(p_title), 'Révision pour : ' || deadline.title, 'medium', (p_due_date + time '12:00') at time zone 'Europe/Paris', false)
    returning id into task_id;
  update public.student_deadlines set linked_task_id = task_id where id = p_deadline_id and user_id = owner;
  return task_id;
end;
$$;
revoke all on function public.create_student_revision_task(uuid, text, date) from public, anon;
grant execute on function public.create_student_revision_task(uuid, text, date) to authenticated;

-- An import either commits in full or fails in full. There is no URL fetching.
create function public.import_student_calendar(p_semester_key text, p_source_key text, p_events jsonb) returns integer
language plpgsql security invoker set search_path = '' as $$
declare owner uuid := auth.uid(); item jsonb; imported integer := 0; event_sequence integer; event_version timestamptz;
begin
  if owner is null then raise exception 'Authentification requise.'; end if;
  if p_semester_key is null or p_semester_key !~ '^[0-9]{4}-[0-9]{4}/S([1-9]|1[0-2])$' then raise exception 'Semestre invalide.'; end if;
  if p_source_key is null or length(btrim(p_source_key)) not between 1 and 120 then raise exception 'Nom de source requis (120 caractères maximum).'; end if;
  if p_events is null or jsonb_typeof(p_events) <> 'array' then raise exception 'Liste d’événements requise.'; end if;
  if jsonb_array_length(p_events) not between 1 and 2000 or octet_length(p_events::text) > 4194304 then raise exception 'Import trop volumineux.'; end if;
  for item in select value from jsonb_array_elements(p_events) loop
    event_sequence := (item->>'sequence')::integer;
    event_version := (item->>'version_at')::timestamptz;
    if coalesce(item->>'recurrence_id', '') <> '' and exists (
      select 1 from public.student_calendar_events master
      where master.user_id = owner and master.semester_key = p_semester_key and master.source_key = btrim(p_source_key)
        and master.uid = item->>'uid' and master.recurrence_id = '' and master.status = 'cancelled'
        and (master.sequence > event_sequence or (master.sequence = event_sequence and master.version_at >= event_version))
    ) then
      item := jsonb_set(item, '{status}', '"cancelled"'::jsonb);
    end if;
    insert into public.student_calendar_events as existing (user_id, semester_key, source_key, uid, recurrence_id, title, location, description, starts_at, ends_at, all_day, status, sequence, version_at)
      values (owner, p_semester_key, btrim(p_source_key), item->>'uid', coalesce(item->>'recurrence_id', ''), item->>'title', coalesce(item->>'location', ''), coalesce(item->>'description', ''), (item->>'starts_at')::timestamptz, (item->>'ends_at')::timestamptz, (item->>'all_day')::boolean, item->>'status', event_sequence, event_version)
      on conflict (user_id, semester_key, source_key, uid, recurrence_id) do update
        set title = excluded.title, location = excluded.location, description = excluded.description,
          starts_at = excluded.starts_at, ends_at = excluded.ends_at, all_day = excluded.all_day,
          status = excluded.status, sequence = excluded.sequence, version_at = excluded.version_at
        where excluded.sequence > existing.sequence or (excluded.sequence = existing.sequence and excluded.version_at >= existing.version_at);
    -- A cancellation without RECURRENCE-ID applies to the entire UID, but never overwrites newer occurrences.
    if item->>'status' = 'cancelled' and coalesce(item->>'recurrence_id', '') = '' then
      update public.student_calendar_events set status = 'cancelled', sequence = event_sequence, version_at = event_version
        where user_id = owner and semester_key = p_semester_key and source_key = btrim(p_source_key) and uid = item->>'uid'
          and (event_sequence > sequence or (event_sequence = sequence and event_version >= version_at));
    end if;
    imported := imported + 1;
  end loop;
  return imported;
end;
$$;
revoke all on function public.import_student_calendar(text, text, jsonb) from public, anon;
grant execute on function public.import_student_calendar(text, text, jsonb) to authenticated;
