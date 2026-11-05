-- Run against a local test database after the application and Google migrations.
-- Every fixture and mutation is rolled back.
begin;

do $$
declare
  v_alice uuid := 'f1000000-0000-4000-8000-000000000001';
  v_bob uuid := 'f1000000-0000-4000-8000-000000000002';
  v_state text := repeat('s',43);
  v_nonce text := repeat('n',43);
  v_confirmation text := repeat('c',43);
  v_result jsonb;
  v_first uuid;
  v_second uuid;
  v_bob_task uuid;
  v_fields jsonb := '{"title":"Google test task","description":"Notes","due_date":"2026-11-03","completed":true}'::jsonb;
begin
  if has_schema_privilege('anon','google_private','usage') or has_schema_privilege('authenticated','google_private','usage') then
    raise exception 'Web roles can access the private schema';
  end if;
  if has_function_privilege('anon','public.google_store(text,uuid,jsonb)','execute') or has_function_privilege('authenticated','public.google_store(text,uuid,jsonb)','execute') then
    raise exception 'Web roles can execute Google storage';
  end if;
  if not has_function_privilege('service_role','public.google_store(text,uuid,jsonb)','execute') then raise exception 'Service facade unavailable'; end if;
  if exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='google_private' and c.relkind='r' and not c.relrowsecurity) then
    raise exception 'A private Google table does not have RLS';
  end if;

  insert into auth.users(id,email) values (v_alice,'google-test-alice@example.invalid'),(v_bob,'google-test-bob@example.invalid');
  perform public.google_store('state_create',v_alice,jsonb_build_object('state_hash',v_state,'nonce_hash',v_nonce,'verifier_cipher','opaque-pkce-ciphertext'));
  if public.google_store('state_consume',null,jsonb_build_object('state_hash',v_state,'nonce_hash',v_nonce)) is not null then raise exception 'Unstarted state accepted'; end if;
  if public.google_store('state_begin',null,jsonb_build_object('state_hash',v_state,'nonce_hash',repeat('x',43))) is not null then raise exception 'Wrong nonce accepted'; end if;
  v_result := public.google_store('state_begin',null,jsonb_build_object('state_hash',v_state,'nonce_hash',v_nonce));
  if (v_result->>'user_id')::uuid is distinct from v_alice then raise exception 'State not bound to initiator'; end if;
  if public.google_store('state_begin',null,jsonb_build_object('state_hash',v_state,'nonce_hash',v_nonce)) is not null then raise exception 'State start replay accepted'; end if;
  if public.google_store('state_consume',null,jsonb_build_object('state_hash',v_state,'nonce_hash',v_nonce)) is null then raise exception 'Valid state rejected'; end if;
  if public.google_store('state_consume',null,jsonb_build_object('state_hash',v_state,'nonce_hash',v_nonce)) is not null then raise exception 'Callback replay accepted'; end if;
  perform public.google_store('state_create',v_alice,jsonb_build_object('state_hash',v_state,'nonce_hash',v_nonce,'verifier_cipher','opaque'));
  update google_private.oauth_states set expires_at=now()-interval '1 second',begun_at=now() where state_hash=v_state;
  if public.google_store('state_consume',null,jsonb_build_object('state_hash',v_state,'nonce_hash',v_nonce)) is not null then raise exception 'Expired state accepted'; end if;

  perform public.google_store('pending_create',v_alice,jsonb_build_object('confirmation_hash',v_confirmation,'subject','google-account-one','account_email','alice@example.invalid','tokens_cipher','opaque-encrypted-token','scopes',jsonb_build_array('tasks')));
  if public.google_store('pending_confirm',v_bob,jsonb_build_object('confirmation_hash',v_confirmation)) <> 'false'::jsonb then raise exception 'Wrong Deepflow user linked Google'; end if;
  if public.google_store('pending_confirm',v_alice,jsonb_build_object('confirmation_hash',v_confirmation)) <> 'true'::jsonb then raise exception 'Valid confirmation rejected'; end if;
  if public.google_store('pending_confirm',v_alice,jsonb_build_object('confirmation_hash',v_confirmation)) <> 'false'::jsonb then raise exception 'Confirmation replay accepted'; end if;

  v_result := public.google_store('task_import',v_alice,jsonb_build_object('subject','google-account-one','list_id','list-one','remote_id','remote-one','remote_updated','version-one','fields',v_fields,'fingerprint','fingerprint-one'));
  v_first := (v_result #>> '{}')::uuid;
  v_result := public.google_store('task_import',v_alice,jsonb_build_object('subject','google-account-one','list_id','list-one','remote_id','remote-one','remote_updated','version-two','fields',v_fields || '{"completed":false,"title":"Updated"}'::jsonb,'fingerprint','fingerprint-two'));
  v_second := (v_result #>> '{}')::uuid;
  if v_first <> v_second then raise exception 'Repeated import duplicated a task'; end if;
  if (select completed from public.tasks where id=v_first) then raise exception 'Import did not reopen task'; end if;
  if (select count(*) from public.tasks where user_id=v_alice) <> 1 then raise exception 'Unexpected imported task count'; end if;
  if not exists(select 1 from google_private.task_mappings where local_task_id=v_first and local_fingerprint='fingerprint-two' and remote_updated='version-two') then raise exception 'Import and mapping not updated together'; end if;

  insert into public.tasks(user_id,title,completed,priority) values(v_bob,'Bob private task',false,'medium') returning id into v_bob_task;
  begin
    perform public.google_store('map_save',v_alice,jsonb_build_object('subject','google-account-one','list_id','list-one','remote_id','foreign-task','local_id',v_bob_task));
    raise exception 'Cross-user task mapping accepted';
  exception when insufficient_privilege then null;
  end;
  perform public.google_store('task_import',v_alice,jsonb_build_object('subject','google-account-one','list_id','list-one','remote_id','remote-with-foreign-hint','local_hint',v_bob_task,'fields',v_fields,'fingerprint','other'));
  if (select title from public.tasks where id=v_bob_task) <> 'Bob private task' then raise exception 'Foreign marker overwrote another user task'; end if;

  if public.google_store('lock_acquire',v_alice,'{"lease":"f2000000-0000-4000-8000-000000000001"}'::jsonb) <> 'true'::jsonb then raise exception 'First lock unavailable'; end if;
  if public.google_store('lock_acquire',v_alice,'{"lease":"f2000000-0000-4000-8000-000000000002"}'::jsonb) <> 'false'::jsonb then raise exception 'Concurrent operation lock accepted'; end if;
  perform public.google_store('lock_release',v_alice,'{"lease":"f2000000-0000-4000-8000-000000000002"}'::jsonb);
  if not exists(select 1 from google_private.operation_locks where user_id=v_alice) then raise exception 'Wrong lease released another operation'; end if;
  perform public.google_store('lock_release',v_alice,'{"lease":"f2000000-0000-4000-8000-000000000001"}'::jsonb);
  if exists(select 1 from google_private.operation_locks where user_id=v_alice) then raise exception 'Correct lease did not release operation'; end if;

  perform public.google_store('disconnect',v_alice);
  if public.google_store('connection_get',v_alice) is not null then raise exception 'Disconnect retained tokens'; end if;
  if exists(select 1 from google_private.pending_connections where user_id=v_alice) or exists(select 1 from google_private.oauth_states where user_id=v_alice) then raise exception 'Disconnect retained OAuth material'; end if;
  if not exists(select 1 from google_private.task_mappings where user_id=v_alice) then raise exception 'Disconnect lost idempotency mappings'; end if;
  delete from auth.users where id=v_alice;
  if exists(select 1 from google_private.task_mappings where user_id=v_alice) then raise exception 'Account deletion retained Google mappings'; end if;
end;
$$;

rollback;
