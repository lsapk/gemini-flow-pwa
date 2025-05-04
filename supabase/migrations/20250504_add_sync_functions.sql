
-- Create a function to handle merging offline and online data
CREATE OR REPLACE FUNCTION public.sync_offline_item(
  p_table_name TEXT,
  p_user_id UUID,
  p_offline_id TEXT,
  p_item JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_query TEXT;
  v_exists BOOLEAN;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Check if the item with this offline_id already exists
  EXECUTE format('
    SELECT EXISTS(
      SELECT 1 FROM %I 
      WHERE offline_id = $1 AND user_id = $2
    )', p_table_name)
  INTO v_exists
  USING p_offline_id, p_user_id;

  IF v_exists THEN
    -- Item exists, update it
    v_query := format('
      UPDATE %I
      SET updated_at = $1, synced_at = $1
      ', p_table_name);

    -- Dynamically build the SET clause based on p_item
    FOR i IN 0..jsonb_array_length(jsonb_object_keys(p_item))-1 LOOP
      v_query := v_query || format(
        '%s %s = $2->$3[%s]', 
        CASE WHEN i > 0 THEN ',' ELSE '' END,
        (jsonb_object_keys(p_item))[i+1],
        i
      );
    END LOOP;

    v_query := v_query || format(' WHERE offline_id = $4 AND user_id = $5 RETURNING id');
    
    EXECUTE v_query
    INTO v_id
    USING v_now, p_item, jsonb_object_keys(p_item), p_offline_id, p_user_id;
  ELSE
    -- Item doesn't exist, insert it
    v_query := format('
      INSERT INTO %I (user_id, offline_id, synced_at', p_table_name);

    -- Dynamically add column names
    FOR i IN 0..jsonb_array_length(jsonb_object_keys(p_item))-1 LOOP
      v_query := v_query || format(
        ', %s', 
        (jsonb_object_keys(p_item))[i+1]
      );
    END LOOP;

    v_query := v_query || format(') VALUES ($1, $2, $3');

    -- Dynamically add placeholders for values
    FOR i IN 0..jsonb_array_length(jsonb_object_keys(p_item))-1 LOOP
      v_query := v_query || format(', $4->$5[%s]', i);
    END LOOP;

    v_query := v_query || format(') RETURNING id');

    EXECUTE v_query
    INTO v_id
    USING p_user_id, p_offline_id, v_now, p_item, jsonb_object_keys(p_item);
  END IF;

  RETURN v_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to sync item to %: %', p_table_name, SQLERRM;
END;
$$;

-- Create a function for batch synchronization
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
