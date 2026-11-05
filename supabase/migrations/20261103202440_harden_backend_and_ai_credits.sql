-- Corrective migration. Existing application rows and subscription history are preserved.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role, authenticated;

-- Old privileged RPCs were executable through PUBLIC by default. Trigger execution
-- does not require a caller EXECUTE grant. Re-grant only audited entry points below.
do $$ declare f record; t record; begin
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prosecdef loop
    execute format('revoke all on function %s from public, anon, authenticated', f.signature);
  end loop;
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r','p') loop
    execute format('alter table public.%I enable row level security', t.relname);
  end loop;
  for t in select c.relname, c.relkind from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('v','m') loop
    if t.relkind = 'v' then
      execute format('alter view public.%I set (security_invoker = true)', t.relname);
    else
      execute format('revoke all on public.%I from public, anon, authenticated', t.relname);
    end if;
  end loop;
end $$;

drop trigger if exists setup_admin_user_trigger on auth.users;
create or replace function public.setup_admin_on_user_create() returns trigger language plpgsql security invoker set search_path = '' as $$
begin return new; end $$;
revoke all on function public.setup_admin_on_user_create() from public, anon, authenticated;
create or replace function public.setup_admin_user() returns void language plpgsql security invoker set search_path = '' as $$
begin raise exception 'Administrator bootstrap has been disabled' using errcode = '42501'; end $$;
revoke all on function public.setup_admin_user() from public, anon, authenticated;

create or replace function public.has_role(_user_id uuid, _role text) returns boolean language sql stable security invoker set search_path = '' as $$
  select _user_id = (select auth.uid()) and exists (select 1 from public.user_roles where user_id = _user_id and role::text = _role);
$$;
revoke all on function public.has_role(uuid, text) from public, anon;
grant execute on function public.has_role(uuid, text) to authenticated;
-- The deployed 2026 schema uses TEXT; older installations used an enum.
do $$ begin
  if to_regtype('public.app_role') is not null then
    execute 'create or replace function public.has_role(_user_id uuid, _role public.app_role) returns boolean language sql stable security invoker set search_path = '''' as $body$ select public.has_role(_user_id,_role::text) $body$';
    execute 'revoke all on function public.has_role(uuid, public.app_role) from public, anon';
    execute 'grant execute on function public.has_role(uuid, public.app_role) to authenticated';
  end if;
end $$;
create or replace function public.is_admin() returns boolean language sql stable security invoker set search_path = '' as $$ select public.has_role(auth.uid(),'admin'::text) $$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- No role, subscription, receipt or usage writes are accepted from a browser.
do $$ declare t text; p record; begin
  foreach t in array array['user_roles','subscribers','subscription_history','ai_requests','ai_credits','daily_usage','paypal_orders'] loop
    if to_regclass('public.' || t) is not null then
      for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop execute format('drop policy %I on public.%I', p.policyname, t); end loop;
      execute format('revoke all on public.%I from anon, authenticated', t);
      execute format('grant select on public.%I to authenticated', t);
      execute format('create policy owner_read on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    end if;
  end loop;
end $$;

-- Old OAuth bearer/refresh secrets are preserved for operator revocation only.
do $$ declare t text; begin
  foreach t in array array['google_calendar_tokens','google_tasks_tokens','google_calendar_tokens_safe','google_tasks_tokens_safe','google_calendar_oauth_states','google_tasks_oauth_states','oauth_tokens','oauth_authorizations','oauth_apps','oauth_user_consents','api_request_logs'] loop
    if to_regclass('public.' || t) is not null then execute format('revoke all on public.%I from public, anon, authenticated', t); end if;
  end loop;
end $$;

-- Known private app tables: both old-row and new-row ownership are checked.
do $$ declare t text; k text; p record; begin
  foreach t in array array['tasks','habits','goals','journal_entries','focus_sessions','background_focus_sessions','daily_reflections','subjects','lessons','study_sessions','habit_completions','subtasks','subobjectives','ai_pending_actions','user_profiles','user_settings','profiles'] loop
    if to_regclass('public.' || t) is not null then
      k := case when t in ('profiles','user_profiles','user_settings') then 'id' else 'user_id' end;
      for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop execute format('drop policy %I on public.%I', p.policyname, t); end loop;
      execute format('revoke all on public.%I from anon', t);
      execute format('grant select, insert, update, delete on public.%I to authenticated', t);
      execute format('create policy owner_access on public.%I for all to authenticated using ((select auth.uid()) = %I) with check ((select auth.uid()) = %I)', t, k, k);
    end if;
  end loop;
end $$;

-- A linked record must belong to the same owner. A trigger prevents relationship
-- reassignment even when a client bypasses the application API.
create or replace function private.enforce_owned_references() returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_row jsonb := to_jsonb(new); v_key text; v_table text; v_owner uuid; v_ref uuid;
begin
  for v_key, v_table in select * from (values ('linked_goal_id','goals'),('parent_goal_id','goals'),('parent_task_id','tasks'),('habit_id','habits'),('subject_id','subjects'),('lesson_id','lessons')) as refs(k,t) loop
    if v_row ? v_key and v_row->>v_key is not null then
      v_ref := (v_row->>v_key)::uuid;
      execute format('select user_id from public.%I where id = $1', v_table) into v_owner using v_ref;
      if v_owner is null or v_owner is distinct from new.user_id then raise exception 'Related record ownership mismatch' using errcode = '42501'; end if;
    end if;
  end loop;
  return new;
end $$;
do $$ declare t text; begin
  foreach t in array array['tasks','habits','subtasks','subobjectives','habit_completions','lessons','study_sessions'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists enforce_owned_references on public.%I', t);
      execute format('create trigger enforce_owned_references before insert or update on public.%I for each row execute function private.enforce_owned_references()', t);
    end if;
  end loop;
end $$;

-- Generated types contain unrelated automation-engine secrets in public. Keep
-- server access, but remove these tables from both web roles. No rows are deleted.
do $$ declare t text; begin
  foreach t in array array['annotation_tag_entity','auth_identity','auth_provider_sync_history','credentials_entity','event_destinations','execution_annotation_tags','execution_annotations','execution_data','execution_entity','execution_metadata','folder','folder_tag','installed_nodes','installed_packages','invalid_auth_token','migrations','project','project_relation','role','settings','shared_credentials','shared_workflow','tag_entity','test_case_execution','test_definition','test_metric','test_run','user','user_api_keys','variables','webhook_entity','workflow_entity','workflow_history','workflow_statistics','workflows_tags'] loop
    if to_regclass('public.' || t) is not null then execute format('revoke all on public.%I from public, anon, authenticated', t); end if;
  end loop;
end $$;

create or replace function public.setup_new_subscriber() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email is not null then insert into public.subscribers (user_id, email, subscribed, subscription_tier) values (new.id, new.email, false, null) on conflict (user_id) do nothing; end if;
  return new;
end $$;
revoke all on function public.setup_new_subscriber() from public, anon, authenticated;
do $$ begin
  if to_regprocedure('public.handle_new_user()') is not null then alter function public.handle_new_user() set search_path = ''; end if;
end $$;

alter table public.subscribers add column if not exists stripe_verified_at timestamptz;
alter table public.subscribers add column if not exists stripe_subscription_id text;
alter table public.subscribers add column if not exists stripe_event_created bigint not null default 0;
create unique index if not exists subscribers_stripe_customer_unique on public.subscribers(stripe_customer_id) where stripe_customer_id is not null;

create table public.ai_credit_plans (tier text primary key, daily_credits integer not null check (daily_credits between 0 and 10000));
insert into public.ai_credit_plans values ('free',5), ('basic',50), ('premium',200), ('ultimate',500);
alter table public.ai_credit_plans enable row level security;
revoke all on public.ai_credit_plans from public, anon, authenticated;
grant all on public.ai_credit_plans to service_role;

create table public.ai_credit_usage (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  service text not null check (service in ('chat','analysis')), status text not null default 'reserved' check (status in ('reserved','succeeded','refunded')),
  created_at timestamptz not null default now(), completed_at timestamptz
);
create index ai_credit_usage_user_day on public.ai_credit_usage(user_id, created_at) where status <> 'refunded';
alter table public.ai_credit_usage enable row level security;
revoke all on public.ai_credit_usage from public, anon, authenticated;
grant select on public.ai_credit_usage to authenticated;
grant all on public.ai_credit_usage to service_role;
create policy owner_read on public.ai_credit_usage for select to authenticated using ((select auth.uid()) = user_id);

create table public.stripe_webhook_events (event_id text primary key, created_at timestamptz not null default now());
alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from public, anon, authenticated;
grant all on public.stripe_webhook_events to service_role;

create or replace function private.ai_usage(p_user_id uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_tier text := 'free'; v_limit integer; v_used integer; v_start timestamptz := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
begin
  select lower(subscription_tier) into v_tier from public.subscribers where user_id = p_user_id and subscribed and stripe_verified_at is not null and subscription_end > now();
  v_tier := coalesce(v_tier, 'free');
  select daily_credits into v_limit from public.ai_credit_plans where tier = v_tier;
  if v_limit is null then v_tier := 'free'; select daily_credits into v_limit from public.ai_credit_plans where tier = 'free'; end if;
  select count(*)::integer into v_used from public.ai_credit_usage where user_id = p_user_id and created_at >= v_start and status <> 'refunded';
  return jsonb_build_object('tier',v_tier,'is_premium',v_tier <> 'free','daily_limit',v_limit,'used',v_used,'remaining',greatest(v_limit-v_used,0),'resets_at',v_start + interval '1 day');
end $$;
revoke all on function private.ai_usage(uuid) from public, anon, authenticated;

create or replace function private.reserve_ai_credit(p_user_id uuid, p_service text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_usage jsonb; v_id uuid;
begin
  if p_user_id is null or p_service not in ('chat','analysis') then raise exception 'Invalid reservation' using errcode = '22023'; end if;
  -- One transaction-scoped lock per identity serializes simultaneous requests.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 8307));
  v_usage := private.ai_usage(p_user_id);
  if (v_usage->>'remaining')::integer <= 0 then return v_usage || jsonb_build_object('allowed',false); end if;
  insert into public.ai_credit_usage(user_id,service) values (p_user_id,p_service) returning id into v_id;
  return private.ai_usage(p_user_id) || jsonb_build_object('allowed',true,'reservation_id',v_id);
end $$;
revoke all on function private.reserve_ai_credit(uuid,text) from public, anon, authenticated;
grant execute on function private.reserve_ai_credit(uuid,text) to service_role;
create or replace function public.reserve_ai_credit(p_user_id uuid, p_service text) returns jsonb language sql security invoker set search_path = '' as $$ select private.reserve_ai_credit(p_user_id,p_service) $$;
revoke all on function public.reserve_ai_credit(uuid,text) from public, anon, authenticated;
grant execute on function public.reserve_ai_credit(uuid,text) to service_role;

create or replace function private.finish_ai_credit(p_reservation_id uuid, p_succeeded boolean) returns void language plpgsql security definer set search_path = '' as $$
declare v_usage public.ai_credit_usage;
begin
  if p_succeeded is null then raise exception 'Result required' using errcode = '22023'; end if;
  update public.ai_credit_usage set status = case when p_succeeded then 'succeeded' else 'refunded' end, completed_at = now() where id = p_reservation_id and status = 'reserved' returning * into v_usage;
  if found and p_succeeded then insert into public.ai_requests(user_id,service) values (v_usage.user_id,v_usage.service); end if;
end $$;
revoke all on function private.finish_ai_credit(uuid,boolean) from public, anon, authenticated;
grant execute on function private.finish_ai_credit(uuid,boolean) to service_role;
create or replace function public.finish_ai_credit(p_reservation_id uuid, p_succeeded boolean) returns void language sql security invoker set search_path = '' as $$ select private.finish_ai_credit(p_reservation_id,p_succeeded) $$;
revoke all on function public.finish_ai_credit(uuid,boolean) from public, anon, authenticated;
grant execute on function public.finish_ai_credit(uuid,boolean) to service_role;

create or replace function private.get_ai_usage() returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  return private.ai_usage(auth.uid());
end $$;
revoke all on function private.get_ai_usage() from public, anon;
grant execute on function private.get_ai_usage() to authenticated;
create or replace function public.get_ai_usage() returns jsonb language sql security invoker set search_path = '' as $$ select private.get_ai_usage() $$;
revoke all on function public.get_ai_usage() from public, anon;
grant execute on function public.get_ai_usage() to authenticated;

create or replace function private.apply_stripe_subscription(p_event_id text, p_event_created bigint, p_user_id uuid, p_customer_id text, p_subscription_id text, p_subscribed boolean, p_tier text, p_subscription_end timestamptz) returns void language plpgsql security definer set search_path = '' as $$
declare v_customer text; v_last bigint;
begin
  if p_event_id !~ '^evt_[A-Za-z0-9]+$' or p_event_created is null or p_subscribed is null or p_subscription_end is null or (p_subscribed and (p_tier is null or p_tier not in ('basic','premium','ultimate'))) then raise exception 'Invalid subscription event'; end if;
  select stripe_customer_id, stripe_event_created into v_customer, v_last from public.subscribers where user_id = p_user_id for update;
  if v_customer is null or v_customer is distinct from p_customer_id then raise exception 'Customer ownership mismatch' using errcode = '42501'; end if;
  insert into public.stripe_webhook_events(event_id) values (p_event_id) on conflict do nothing;
  if not found or p_event_created < v_last then return; end if;
  update public.subscribers set subscribed = p_subscribed, subscription_tier = p_tier, subscription_end = p_subscription_end, stripe_subscription_id = p_subscription_id, stripe_verified_at = now(), stripe_event_created = p_event_created, updated_at = now() where user_id = p_user_id;
end $$;
revoke all on function private.apply_stripe_subscription(text,bigint,uuid,text,text,boolean,text,timestamptz) from public, anon, authenticated;
grant execute on function private.apply_stripe_subscription(text,bigint,uuid,text,text,boolean,text,timestamptz) to service_role;
create or replace function public.apply_stripe_subscription(p_event_id text, p_event_created bigint, p_user_id uuid, p_customer_id text, p_subscription_id text, p_subscribed boolean, p_tier text, p_subscription_end timestamptz) returns void language sql security invoker set search_path = '' as $$ select private.apply_stripe_subscription(p_event_id,p_event_created,p_user_id,p_customer_id,p_subscription_id,p_subscribed,p_tier,p_subscription_end) $$;
revoke all on function public.apply_stripe_subscription(text,bigint,uuid,text,text,boolean,text,timestamptz) from public, anon, authenticated;
grant execute on function public.apply_stripe_subscription(text,bigint,uuid,text,text,boolean,text,timestamptz) to service_role;

-- Replace unsafe SECURITY DEFINER dynamic synchronization with a caller-scoped,
-- allowlisted implementation. Identifiers are quoted; values stay parameters.
create or replace function public.sync_offline_item(p_table_name text, p_user_id uuid, p_offline_id text, p_item jsonb) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid; v_fields text; v_values text; v_updates text; v_allowed text[]; v_key text; v_item jsonb;
begin
  if auth.uid() is null or p_user_id is distinct from auth.uid() then raise exception 'Identity mismatch' using errcode = '42501'; end if;
  if p_table_name not in ('tasks','habits','goals','journal_entries','focus_sessions') then raise exception 'Invalid sync table' using errcode = '22023'; end if;
  if p_offline_id is null or length(p_offline_id) not between 1 and 200 or jsonb_typeof(p_item) is distinct from 'object' then raise exception 'Invalid sync record' using errcode = '22023'; end if;
  if p_item ? 'user_id' and p_item->>'user_id' is distinct from p_user_id::text then raise exception 'Ownership mismatch' using errcode = '42501'; end if;
  v_allowed := case p_table_name
    when 'tasks' then array['title','description','completed','due_date','priority','sort_order','linked_goal_id','parent_task_id']
    when 'habits' then array['title','description','frequency','target','category','streak','last_completed_at','sort_order','is_archived','linked_goal_id']
    when 'goals' then array['title','description','category','completed','progress','target_date','sort_order','is_archived']
    when 'journal_entries' then array['title','content','mood','tags']
    when 'focus_sessions' then array['title','duration','started_at','completed_at'] end;
  v_item := p_item - array['id','user_id','offline_id','created_at','updated_at','synced_at'];
  for v_key in select jsonb_object_keys(v_item) loop
    if not v_key = any(v_allowed) then raise exception 'Invalid sync field' using errcode = '22023'; end if;
  end loop;
  select string_agg(format('%I', a.attname),','), string_agg(format('r.%I', a.attname),','), string_agg(format('%1$I = r.%1$I', a.attname),',')
    into v_fields,v_values,v_updates from pg_attribute a where a.attrelid = to_regclass('public.' || p_table_name) and a.attnum > 0 and not a.attisdropped and v_item ? a.attname;
  if v_fields is null then raise exception 'Sync record has no editable fields' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_table_name || ':' || p_offline_id, 8308));
  execute format('select id from public.%I where user_id = $1 and offline_id = $2 for update', p_table_name) into v_id using p_user_id,p_offline_id;
  if v_id is not null then
    execute format('update public.%1$I t set %2$s, updated_at = now(), synced_at = now() from jsonb_populate_record(null::public.%1$I,$1) r where t.id = $2 and t.user_id = $3 returning t.id', p_table_name,v_updates) into v_id using v_item,v_id,p_user_id;
  else
    execute format('insert into public.%1$I(user_id,offline_id,synced_at,%2$s) select $1,$2,now(),%3$s from jsonb_populate_record(null::public.%1$I,$3) r returning id', p_table_name,v_fields,v_values) into v_id using p_user_id,p_offline_id,v_item;
  end if;
  return v_id;
end $$;
revoke all on function public.sync_offline_item(text,uuid,text,jsonb) from public, anon;
grant execute on function public.sync_offline_item(text,uuid,text,jsonb) to authenticated;

create or replace function public.batch_sync_offline_data(p_user_id uuid,p_tasks jsonb default null,p_habits jsonb default null,p_goals jsonb default null,p_journal jsonb default null,p_focus jsonb default null) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_group record; v_item jsonb; v_id uuid; v_ids jsonb; v_result jsonb := '{}'::jsonb; v_count integer := 0;
begin
  if auth.uid() is null or p_user_id is distinct from auth.uid() then raise exception 'Identity mismatch' using errcode = '42501'; end if;
  for v_group in select * from (values ('tasks','tasks',p_tasks),('habits','habits',p_habits),('goals','goals',p_goals),('journal','journal_entries',p_journal),('focus','focus_sessions',p_focus)) as groups(label,tbl,items) loop
    v_ids := '[]'::jsonb;
    if v_group.items is not null then
      if jsonb_typeof(v_group.items) is distinct from 'array' then raise exception 'Invalid sync batch'; end if;
      if jsonb_array_length(v_group.items) > 100 then raise exception 'Sync batch too large'; end if;
      for v_item in select value from jsonb_array_elements(v_group.items) loop
        v_id := public.sync_offline_item(v_group.tbl,p_user_id,v_item->>'offline_id',v_item);
        v_ids := v_ids || to_jsonb(v_id); v_count := v_count + 1;
      end loop;
    end if;
    v_result := v_result || jsonb_build_object(v_group.label,v_ids);
  end loop;
  return jsonb_build_object('success',true,'count',v_count,'synced_ids',v_result);
end $$;
revoke all on function public.batch_sync_offline_data(uuid,jsonb,jsonb,jsonb,jsonb,jsonb) from public, anon;
grant execute on function public.batch_sync_offline_data(uuid,jsonb,jsonb,jsonb,jsonb,jsonb) to authenticated;

commit;
