
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_period text DEFAULT 'all'::text, p_limit integer DEFAULT 100)
 RETURNS TABLE(rank bigint, user_id uuid, display_name text, photo_url text, score bigint, tasks_done bigint, habits_done bigint, focus_minutes bigint, journal_count bigint, reflection_count bigint, goals_done bigint, is_me boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    SELECT
      p.id AS uid,
      COALESCE(NULLIF(TRIM(p.display_name), ''), INITCAP(split_part(p.email, '@', 1))) AS dname,
      p.photo_url AS purl
    FROM public.user_profiles p
    WHERE coalesce(p.leaderboard_opt_in, true) = true
      AND p.email NOT LIKE '%@example.invalid'
      AND p.email NOT LIKE '%@invalid.local'
  ),
  t AS (
    SELECT tk.user_id AS uid, count(*)::bigint AS n
    FROM public.tasks tk
    WHERE tk.completed = true AND coalesce(tk.updated_at, tk.created_at) >= v_since
    GROUP BY tk.user_id
  ),
  hc AS (
    SELECT h.user_id AS uid, count(*)::bigint AS n
    FROM public.habit_completions h
    WHERE h.created_at >= v_since
    GROUP BY h.user_id
  ),
  f AS (
    SELECT fs.user_id AS uid, coalesce(sum(fs.duration),0)::bigint AS mins
    FROM public.focus_sessions fs
    WHERE coalesce(fs.completed_at, fs.started_at, fs.created_at) >= v_since
    GROUP BY fs.user_id
  ),
  j AS (
    SELECT je.user_id AS uid, count(*)::bigint AS n
    FROM public.journal_entries je
    WHERE je.created_at >= v_since
    GROUP BY je.user_id
  ),
  r AS (
    SELECT dr.user_id AS uid, count(*)::bigint AS n
    FROM public.daily_reflections dr
    WHERE dr.created_at >= v_since
    GROUP BY dr.user_id
  ),
  g AS (
    SELECT gl.user_id AS uid, count(*)::bigint AS n
    FROM public.goals gl
    WHERE gl.completed = true AND coalesce(gl.updated_at, gl.created_at) >= v_since
    GROUP BY gl.user_id
  ),
  agg AS (
    SELECT
      b.uid, b.dname, b.purl,
      coalesce(t.n, 0)   AS tasks_done,
      coalesce(hc.n, 0)  AS habits_done,
      coalesce(f.mins,0) AS focus_minutes,
      coalesce(j.n, 0)   AS journal_count,
      coalesce(r.n, 0)   AS reflection_count,
      coalesce(g.n, 0)   AS goals_done,
      (coalesce(t.n,0)*10 + coalesce(hc.n,0)*5 + coalesce(f.mins,0)
       + coalesce(j.n,0)*8 + coalesce(r.n,0)*8 + coalesce(g.n,0)*25)::bigint AS score
    FROM base b
    LEFT JOIN t  ON t.uid  = b.uid
    LEFT JOIN hc ON hc.uid = b.uid
    LEFT JOIN f  ON f.uid  = b.uid
    LEFT JOIN j  ON j.uid  = b.uid
    LEFT JOIN r  ON r.uid  = b.uid
    LEFT JOIN g  ON g.uid  = b.uid
  ),
  ranked AS (
    SELECT rank() OVER (ORDER BY a.score DESC, a.uid) AS rnk, a.*
    FROM agg a
  )
  SELECT
    ranked.rnk, ranked.uid,
    coalesce(ranked.dname, 'Utilisateur'),
    ranked.purl, ranked.score,
    ranked.tasks_done, ranked.habits_done, ranked.focus_minutes,
    ranked.journal_count, ranked.reflection_count, ranked.goals_done,
    (ranked.uid = auth.uid())
  FROM ranked
  WHERE ranked.rnk <= p_limit OR ranked.uid = auth.uid()
  ORDER BY ranked.rnk ASC;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(text, integer) TO authenticated;
