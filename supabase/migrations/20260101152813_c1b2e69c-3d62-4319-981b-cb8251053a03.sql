-- Fix SQL injection vulnerability in sync_offline_item function
-- Use %I format specifier to properly quote identifiers and add column whitelist validation

-- Drop and recreate the sync_offline_item function with proper SQL injection protection
CREATE OR REPLACE FUNCTION public.sync_offline_item(
  p_table_name TEXT,
  p_user_id UUID,
  p_offline_id TEXT,
  p_item JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_exists BOOLEAN;
  v_now TIMESTAMPTZ := now();
  v_key TEXT;
  v_keys TEXT[];
  v_set_clause TEXT := '';
  v_cols_clause TEXT := '';
  v_vals_clause TEXT := '';
  v_counter INT := 0;
  -- Whitelist of allowed tables
  v_allowed_tables TEXT[] := ARRAY['tasks', 'habits', 'goals', 'journal_entries', 'focus_sessions'];
  -- Whitelist of allowed columns per table (common columns that can be synced)
  v_allowed_columns TEXT[] := ARRAY[
    'title', 'description', 'completed', 'priority', 'due_date', 'category',
    'frequency', 'target', 'streak', 'days_of_week', 'is_archived', 'sort_order',
    'progress', 'target_date', 'content', 'mood', 'tags', 'duration', 
    'started_at', 'completed_at', 'linked_goal_id'
  ];
BEGIN
  -- SECURITY: Validate table name against whitelist
  IF NOT (p_table_name = ANY(v_allowed_tables)) THEN
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;

  -- Extract and validate all keys from the JSONB
  FOR v_key IN SELECT jsonb_object_keys(p_item)
  LOOP
    -- Skip system columns that should not be modified
    IF v_key IN ('id', 'user_id', 'offline_id', 'synced_at', 'created_at', 'updated_at') THEN
      CONTINUE;
    END IF;
    
    -- SECURITY: Validate column name against whitelist
    IF NOT (v_key = ANY(v_allowed_columns)) THEN
      RAISE EXCEPTION 'Invalid column name: %', v_key;
    END IF;
    
    v_keys := array_append(v_keys, v_key);
  END LOOP;

  -- Check if the item with this offline_id already exists
  -- Using %I for safe identifier quoting
  EXECUTE format('
    SELECT EXISTS(
      SELECT 1 FROM %I 
      WHERE offline_id = $1 AND user_id = $2
    )', p_table_name)
  INTO v_exists
  USING p_offline_id, p_user_id;

  IF v_exists THEN
    -- Item exists, build UPDATE query safely
    v_set_clause := 'updated_at = $1, synced_at = $1';
    
    FOREACH v_key IN ARRAY v_keys
    LOOP
      -- Use %I to safely quote the identifier
      v_set_clause := v_set_clause || format(', %I = $2->>%L', v_key, v_key);
    END LOOP;

    EXECUTE format('
      UPDATE %I
      SET %s
      WHERE offline_id = $3 AND user_id = $4
      RETURNING id', p_table_name, v_set_clause)
    INTO v_id
    USING v_now, p_item, p_offline_id, p_user_id;
  ELSE
    -- Item doesn't exist, build INSERT query safely
    v_cols_clause := 'user_id, offline_id, synced_at';
    v_vals_clause := '$1, $2, $3';
    v_counter := 4;
    
    FOREACH v_key IN ARRAY v_keys
    LOOP
      -- Use %I to safely quote the identifier
      v_cols_clause := v_cols_clause || format(', %I', v_key);
      v_vals_clause := v_vals_clause || format(', $4->>%L', v_key);
    END LOOP;

    EXECUTE format('
      INSERT INTO %I (%s)
      VALUES (%s)
      RETURNING id', p_table_name, v_cols_clause, v_vals_clause)
    INTO v_id
    USING p_user_id, p_offline_id, v_now, p_item;
  END IF;

  RETURN v_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to sync item to %: %', p_table_name, SQLERRM;
END;
$$;

-- Also update the batch_sync_offline_data function to set search_path
CREATE OR REPLACE FUNCTION public.batch_sync_offline_data(
  p_user_id UUID,
  p_tasks JSONB DEFAULT NULL,
  p_habits JSONB DEFAULT NULL,
  p_goals JSONB DEFAULT NULL,
  p_journal JSONB DEFAULT NULL,
  p_focus JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB := jsonb_build_object('success', true);
  v_item JSONB;
  v_id UUID;
  v_count INT := 0;
  v_task_ids UUID[] := '{}';
  v_habit_ids UUID[] := '{}';
  v_goal_ids UUID[] := '{}';
  v_journal_ids UUID[] := '{}';
  v_focus_ids UUID[] := '{}';
BEGIN
  -- Process tasks
  IF p_tasks IS NOT NULL THEN
    FOR i IN 0..jsonb_array_length(p_tasks)-1 LOOP
      v_item := p_tasks->i;
      BEGIN
        v_id := public.sync_offline_item('tasks', p_user_id, v_item->>'offline_id', v_item);
        v_task_ids := array_append(v_task_ids, v_id);
        v_count := v_count + 1;
      EXCEPTION
        WHEN OTHERS THEN
          v_result := jsonb_set(v_result, '{errors, tasks}', 
                       coalesce(v_result->'errors'->'tasks', '[]'::jsonb) || 
                       jsonb_build_object('index', i, 'message', SQLERRM));
      END;
    END LOOP;
  END IF;

  -- Process habits
  IF p_habits IS NOT NULL THEN
    FOR i IN 0..jsonb_array_length(p_habits)-1 LOOP
      v_item := p_habits->i;
      BEGIN
        v_id := public.sync_offline_item('habits', p_user_id, v_item->>'offline_id', v_item);
        v_habit_ids := array_append(v_habit_ids, v_id);
        v_count := v_count + 1;
      EXCEPTION
        WHEN OTHERS THEN
          v_result := jsonb_set(v_result, '{errors, habits}', 
                       coalesce(v_result->'errors'->'habits', '[]'::jsonb) || 
                       jsonb_build_object('index', i, 'message', SQLERRM));
      END;
    END LOOP;
  END IF;

  -- Process goals
  IF p_goals IS NOT NULL THEN
    FOR i IN 0..jsonb_array_length(p_goals)-1 LOOP
      v_item := p_goals->i;
      BEGIN
        v_id := public.sync_offline_item('goals', p_user_id, v_item->>'offline_id', v_item);
        v_goal_ids := array_append(v_goal_ids, v_id);
        v_count := v_count + 1;
      EXCEPTION
        WHEN OTHERS THEN
          v_result := jsonb_set(v_result, '{errors, goals}', 
                       coalesce(v_result->'errors'->'goals', '[]'::jsonb) || 
                       jsonb_build_object('index', i, 'message', SQLERRM));
      END;
    END LOOP;
  END IF;

  -- Process journal entries
  IF p_journal IS NOT NULL THEN
    FOR i IN 0..jsonb_array_length(p_journal)-1 LOOP
      v_item := p_journal->i;
      BEGIN
        v_id := public.sync_offline_item('journal_entries', p_user_id, v_item->>'offline_id', v_item);
        v_journal_ids := array_append(v_journal_ids, v_id);
        v_count := v_count + 1;
      EXCEPTION
        WHEN OTHERS THEN
          v_result := jsonb_set(v_result, '{errors, journal}', 
                       coalesce(v_result->'errors'->'journal', '[]'::jsonb) || 
                       jsonb_build_object('index', i, 'message', SQLERRM));
      END;
    END LOOP;
  END IF;

  -- Process focus sessions
  IF p_focus IS NOT NULL THEN
    FOR i IN 0..jsonb_array_length(p_focus)-1 LOOP
      v_item := p_focus->i;
      BEGIN
        v_id := public.sync_offline_item('focus_sessions', p_user_id, v_item->>'offline_id', v_item);
        v_focus_ids := array_append(v_focus_ids, v_id);
        v_count := v_count + 1;
      EXCEPTION
        WHEN OTHERS THEN
          v_result := jsonb_set(v_result, '{errors, focus}', 
                       coalesce(v_result->'errors'->'focus', '[]'::jsonb) || 
                       jsonb_build_object('index', i, 'message', SQLERRM));
      END;
    END LOOP;
  END IF;

  v_result := jsonb_set(v_result, '{count}', to_jsonb(v_count));
  v_result := jsonb_set(v_result, '{synced_ids}', jsonb_build_object(
    'tasks', to_jsonb(v_task_ids),
    'habits', to_jsonb(v_habit_ids),
    'goals', to_jsonb(v_goal_ids),
    'journal', to_jsonb(v_journal_ids),
    'focus', to_jsonb(v_focus_ids)
  ));
  
  RETURN v_result;
END;
$$;