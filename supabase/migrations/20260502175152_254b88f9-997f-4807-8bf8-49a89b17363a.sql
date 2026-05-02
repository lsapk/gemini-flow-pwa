REVOKE EXECUTE ON FUNCTION public.batch_sync_offline_data(uuid, jsonb, jsonb, jsonb, jsonb, jsonb) FROM anon, public;
-- Keep authenticated execute since the client calls it from logged-in sessions