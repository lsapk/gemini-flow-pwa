-- Tokens and OAuth material are intentionally outside all exposed API schemas.
create schema if not exists google_private;
revoke all on schema google_private from public, anon, authenticated, service_role;

create table google_private.connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  google_subject text not null,
  account_email text,
  tokens_cipher text not null,
  scopes text[] not null,
  connected_at timestamptz not null default now(),
  last_pull_at timestamptz,
  last_push_at timestamptz,
  needs_reconnect boolean not null default false
);

create table google_private.oauth_states (
  state_hash text primary key check (length(state_hash) = 43),
  user_id uuid not null references auth.users(id) on delete cascade,
  nonce_hash text not null check (length(nonce_hash) = 43),
  verifier_cipher text not null,
  begun_at timestamptz,
  expires_at timestamptz not null default (now() + interval '10 minutes')
);
create index google_oauth_states_user_idx on google_private.oauth_states(user_id);

create table google_private.pending_connections (
  confirmation_hash text primary key check (length(confirmation_hash) = 43),
  user_id uuid not null references auth.users(id) on delete cascade,
  google_subject text not null,
  account_email text,
  tokens_cipher text not null,
  scopes text[] not null,
  expires_at timestamptz not null default (now() + interval '10 minutes')
);
create index google_pending_connections_user_idx on google_private.pending_connections(user_id);

create table google_private.task_mappings (
  user_id uuid not null references auth.users(id) on delete cascade,
  google_subject text not null,
  google_list_id text not null,
  google_task_id text not null,
  local_task_id uuid not null references public.tasks(id) on delete cascade,
  remote_updated text,
  local_fingerprint text,
  primary key (user_id, google_subject, google_list_id, google_task_id),
  unique (user_id, google_subject, google_list_id, local_task_id)
);
create index google_task_mappings_local_idx on google_private.task_mappings(local_task_id);

create table google_private.operation_locks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  lease uuid not null,
  expires_at timestamptz not null
);

alter table google_private.connections enable row level security;
alter table google_private.oauth_states enable row level security;
alter table google_private.pending_connections enable row level security;
alter table google_private.task_mappings enable row level security;
alter table google_private.operation_locks enable row level security;
revoke all on all tables in schema google_private from public, anon, authenticated, service_role;

-- The single facade is callable ONLY by service_role. Edge handlers authenticate
-- the current Supabase user before supplying p_user_id. No web client can select
-- the private schema or execute this function, even for its own user.
create or replace function public.google_store(p_action text, p_user_id uuid default null, p_payload jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_pending google_private.pending_connections%rowtype;
  v_local_id uuid;
  v_hint uuid;
  v_mapping google_private.task_mappings%rowtype;
  v_lease uuid;
begin
  if p_action = 'state_create' then
    delete from google_private.oauth_states where expires_at < now() or user_id = p_user_id;
    delete from google_private.pending_connections where expires_at < now();
    insert into google_private.oauth_states(state_hash, user_id, nonce_hash, verifier_cipher)
    values (p_payload->>'state_hash', p_user_id, p_payload->>'nonce_hash', p_payload->>'verifier_cipher');
    return 'true'::jsonb;
  elsif p_action = 'state_begin' then
    update google_private.oauth_states set begun_at = now()
    where state_hash = p_payload->>'state_hash' and nonce_hash = p_payload->>'nonce_hash'
      and expires_at > now() and begun_at is null
    returning jsonb_build_object('user_id', user_id, 'verifier_cipher', verifier_cipher) into v_result;
    return v_result;
  elsif p_action = 'state_consume' then
    delete from google_private.oauth_states
    where state_hash = p_payload->>'state_hash' and nonce_hash = p_payload->>'nonce_hash'
      and expires_at > now() and begun_at is not null
    returning jsonb_build_object('user_id', user_id, 'verifier_cipher', verifier_cipher) into v_result;
    return v_result;
  end if;

  if p_user_id is null then raise exception 'User is required' using errcode = '22023'; end if;

  if p_action = 'pending_create' then
    delete from google_private.pending_connections where user_id = p_user_id or expires_at < now();
    insert into google_private.pending_connections(confirmation_hash, user_id, google_subject, account_email, tokens_cipher, scopes)
    values (p_payload->>'confirmation_hash', p_user_id, p_payload->>'subject', p_payload->>'account_email', p_payload->>'tokens_cipher',
      array(select jsonb_array_elements_text(p_payload->'scopes')));
    return 'true'::jsonb;
  elsif p_action = 'pending_confirm' then
    delete from google_private.pending_connections
    where user_id = p_user_id and confirmation_hash = p_payload->>'confirmation_hash' and expires_at > now()
    returning * into v_pending;
    if not found then return 'false'::jsonb; end if;
    insert into google_private.connections(user_id, google_subject, account_email, tokens_cipher, scopes)
    values (p_user_id, v_pending.google_subject, v_pending.account_email, v_pending.tokens_cipher, v_pending.scopes)
    on conflict (user_id) do update set google_subject = excluded.google_subject,
      account_email = excluded.account_email, tokens_cipher = excluded.tokens_cipher, scopes = excluded.scopes,
      connected_at = now(), needs_reconnect = false,
      last_pull_at = case when google_private.connections.google_subject = excluded.google_subject then google_private.connections.last_pull_at else null end,
      last_push_at = case when google_private.connections.google_subject = excluded.google_subject then google_private.connections.last_push_at else null end;
    return 'true'::jsonb;
  elsif p_action = 'connection_get' then
    select to_jsonb(c) into v_result from google_private.connections c where user_id = p_user_id;
    return v_result;
  elsif p_action = 'tokens_update' then
    update google_private.connections set tokens_cipher = p_payload->>'tokens_cipher', needs_reconnect = false
    where user_id = p_user_id and google_subject = p_payload->>'subject';
    if not found then raise exception 'Connection changed' using errcode = '40001'; end if;
    return 'true'::jsonb;
  elsif p_action = 'connection_error' then
    update google_private.connections set needs_reconnect = true where user_id = p_user_id;
    return 'true'::jsonb;
  elsif p_action = 'disconnect' then
    delete from google_private.connections where user_id = p_user_id;
    delete from google_private.oauth_states where user_id = p_user_id;
    delete from google_private.pending_connections where user_id = p_user_id;
    -- Retain non-secret task ID mappings, partitioned by Google subject, to make
    -- reconnecting the same account idempotent. User deletion cascades all rows.
    return 'true'::jsonb;
  elsif p_action = 'lock_acquire' then
    insert into google_private.operation_locks(user_id, lease, expires_at)
    values (p_user_id, (p_payload->>'lease')::uuid, now() + interval '5 minutes')
    on conflict (user_id) do update set lease = excluded.lease, expires_at = excluded.expires_at
    where google_private.operation_locks.expires_at < now()
    returning lease into v_lease;
    return to_jsonb(v_lease is not null);
  elsif p_action = 'lock_release' then
    delete from google_private.operation_locks where user_id = p_user_id and lease = (p_payload->>'lease')::uuid;
    return 'true'::jsonb;
  elsif p_action = 'maps_get' then
    select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb) into v_result
    from google_private.task_mappings m
    where user_id = p_user_id and google_subject = p_payload->>'subject' and google_list_id = p_payload->>'list_id';
    return v_result;
  elsif p_action in ('task_import', 'map_save') then
    if not exists (select 1 from google_private.connections where user_id = p_user_id and google_subject = p_payload->>'subject') then
      raise exception 'Connection changed' using errcode = '40001';
    end if;
    if p_action = 'task_import' then
      select * into v_mapping from google_private.task_mappings
      where user_id = p_user_id and google_subject = p_payload->>'subject' and google_list_id = p_payload->>'list_id' and google_task_id = p_payload->>'remote_id';
      v_local_id := v_mapping.local_task_id;
      -- Recover a remote create that succeeded before a mapping write failed.
      -- The hint is accepted only for an existing task owned by this same user.
      if v_local_id is null and coalesce(p_payload->>'local_hint', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        v_hint := (p_payload->>'local_hint')::uuid;
        if not exists (select 1 from google_private.task_mappings where user_id = p_user_id and google_subject = p_payload->>'subject' and google_list_id = p_payload->>'list_id' and local_task_id = v_hint) then
          select id into v_local_id from public.tasks where id = v_hint and user_id = p_user_id;
        end if;
      end if;
      if v_local_id is null then
        insert into public.tasks(user_id, title, description, due_date, completed, priority)
        values (p_user_id, p_payload->'fields'->>'title', p_payload->'fields'->>'description',
          (p_payload->'fields'->>'due_date')::date, coalesce((p_payload->'fields'->>'completed')::boolean, false), 'medium')
        returning id into v_local_id;
      else
        update public.tasks set title = p_payload->'fields'->>'title', description = p_payload->'fields'->>'description',
          due_date = (p_payload->'fields'->>'due_date')::date, completed = coalesce((p_payload->'fields'->>'completed')::boolean, false), updated_at = now()
        where id = v_local_id and user_id = p_user_id;
        if not found then raise exception 'Task ownership mismatch' using errcode = '42501'; end if;
      end if;
    else
      v_local_id := (p_payload->>'local_id')::uuid;
      if not exists (select 1 from public.tasks where id = v_local_id and user_id = p_user_id) then
        raise exception 'Task ownership mismatch' using errcode = '42501';
      end if;
    end if;
    -- A Google task may have been deleted and recreated after a local edit.
    -- Replace its previous remote identity while keeping the same owned local task.
    delete from google_private.task_mappings
    where user_id = p_user_id and google_subject = p_payload->>'subject'
      and google_list_id = p_payload->>'list_id' and local_task_id = v_local_id
      and google_task_id <> p_payload->>'remote_id';
    insert into google_private.task_mappings(user_id, google_subject, google_list_id, google_task_id, local_task_id, remote_updated, local_fingerprint)
    values (p_user_id, p_payload->>'subject', p_payload->>'list_id', p_payload->>'remote_id', v_local_id, p_payload->>'remote_updated', p_payload->>'fingerprint')
    on conflict (user_id, google_subject, google_list_id, google_task_id) do update
      set local_task_id = excluded.local_task_id, remote_updated = excluded.remote_updated, local_fingerprint = excluded.local_fingerprint;
    return to_jsonb(v_local_id);
  elsif p_action = 'sync_complete' then
    if p_payload->>'direction' = 'pull' then
      update google_private.connections set last_pull_at = now() where user_id = p_user_id;
    elsif p_payload->>'direction' = 'push' then
      update google_private.connections set last_push_at = now() where user_id = p_user_id;
    else raise exception 'Unknown sync direction' using errcode = '22023'; end if;
    return 'true'::jsonb;
  end if;
  raise exception 'Unknown Google storage action' using errcode = '22023';
end;
$$;

revoke all on function public.google_store(text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.google_store(text, uuid, jsonb) to service_role;

comment on function public.google_store(text, uuid, jsonb) is 'Service-only Google OAuth and task mapping facade. Authenticate the user in the Edge Function before calling. Never grant EXECUTE to anon or authenticated.';
