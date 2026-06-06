
-- Leaderboard opt-in column
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS leaderboard_opt_in boolean NOT NULL DEFAULT true;

-- Leaderboard function: aggregates productivity COUNTS only (no content) across all users
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_period text DEFAULT 'all', p_limit int DEFAULT 100)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  display_name text,
  photo_url text,
  score bigint,
  tasks_done bigint,
  habits_done bigint,
  focus_minutes bigint,
  journal_count bigint,
  reflection_count bigint,
  goals_done bigint,
  is_me boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_since timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_since := CASE p_period
    WHEN 'week'  THEN now() - interval '7 days'
    WHEN 'month' THEN now() - interval '30 days'
    ELSE '-infinity'::timestamptz
  END;

  RETURN QUERY
  WITH base AS (
    SELECT p.id AS uid, p.display_name, p.photo_url
    FROM public.user_profiles p
    WHERE coalesce(p.leaderboard_opt_in, true) = true
  ),
  t AS (
    SELECT user_id, count(*)::bigint AS n
    FROM public.tasks
    WHERE completed = true AND coalesce(updated_at, created_at) >= v_since
    GROUP BY user_id
  ),
  hc AS (
    SELECT user_id, count(*)::bigint AS n
    FROM public.habit_completions
    WHERE created_at >= v_since
    GROUP BY user_id
  ),
  f AS (
    SELECT user_id, coalesce(sum(duration),0)::bigint AS mins
    FROM public.focus_sessions
    WHERE coalesce(completed_at, started_at, created_at) >= v_since
    GROUP BY user_id
  ),
  j AS (
    SELECT user_id, count(*)::bigint AS n
    FROM public.journal_entries
    WHERE created_at >= v_since
    GROUP BY user_id
  ),
  r AS (
    SELECT user_id, count(*)::bigint AS n
    FROM public.daily_reflections
    WHERE created_at >= v_since
    GROUP BY user_id
  ),
  g AS (
    SELECT user_id, count(*)::bigint AS n
    FROM public.goals
    WHERE completed = true AND coalesce(updated_at, created_at) >= v_since
    GROUP BY user_id
  ),
  agg AS (
    SELECT
      b.uid,
      b.display_name,
      b.photo_url,
      coalesce(t.n, 0)  AS tasks_done,
      coalesce(hc.n, 0) AS habits_done,
      coalesce(f.mins,0) AS focus_minutes,
      coalesce(j.n, 0)  AS journal_count,
      coalesce(r.n, 0)  AS reflection_count,
      coalesce(g.n, 0)  AS goals_done,
      (coalesce(t.n,0)*10
       + coalesce(hc.n,0)*5
       + coalesce(f.mins,0)
       + coalesce(j.n,0)*8
       + coalesce(r.n,0)*8
       + coalesce(g.n,0)*25)::bigint AS score
    FROM base b
    LEFT JOIN t  ON t.user_id  = b.uid
    LEFT JOIN hc ON hc.user_id = b.uid
    LEFT JOIN f  ON f.user_id  = b.uid
    LEFT JOIN j  ON j.user_id  = b.uid
    LEFT JOIN r  ON r.user_id  = b.uid
    LEFT JOIN g  ON g.user_id  = b.uid
  ),
  ranked AS (
    SELECT
      rank() OVER (ORDER BY score DESC, uid) AS rank,
      *
    FROM agg
  )
  SELECT
    ranked.rank,
    ranked.uid AS user_id,
    coalesce(ranked.display_name, 'Anonyme') AS display_name,
    ranked.photo_url,
    ranked.score,
    ranked.tasks_done,
    ranked.habits_done,
    ranked.focus_minutes,
    ranked.journal_count,
    ranked.reflection_count,
    ranked.goals_done,
    (ranked.uid = auth.uid()) AS is_me
  FROM ranked
  WHERE ranked.rank <= p_limit OR ranked.uid = auth.uid()
  ORDER BY ranked.rank ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(text, int) TO authenticated;
