-- Atomic credit consumption
CREATE OR REPLACE FUNCTION public.consume_ai_credit(amount int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.ai_credits
  SET credits = credits - amount,
      last_updated = now()
  WHERE user_id = auth.uid()
    AND credits >= amount
  RETURNING credits INTO remaining;

  IF remaining IS NULL THEN
    RAISE EXCEPTION 'Crédits insuffisants';
  END IF;

  RETURN remaining;
END;
$$;

-- Atomic daily usage increment
CREATE OR REPLACE FUNCTION public.increment_daily_usage(p_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_type NOT IN ('chat', 'analysis') THEN
    RAISE EXCEPTION 'Invalid usage type: %', p_type;
  END IF;

  INSERT INTO public.daily_usage (user_id, usage_date, ai_chat_count, ai_analysis_count)
  VALUES (
    auth.uid(),
    (now() AT TIME ZONE 'Europe/Paris')::date,
    CASE WHEN p_type = 'chat' THEN 1 ELSE 0 END,
    CASE WHEN p_type = 'analysis' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, usage_date) DO UPDATE
  SET ai_chat_count = public.daily_usage.ai_chat_count + EXCLUDED.ai_chat_count,
      ai_analysis_count = public.daily_usage.ai_analysis_count + EXCLUDED.ai_analysis_count,
      updated_at = now();
END;
$$;

-- Reset today's AI usage for the calling user
CREATE OR REPLACE FUNCTION public.reset_my_daily_ai_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.daily_usage
  WHERE user_id = auth.uid()
    AND usage_date = (now() AT TIME ZONE 'Europe/Paris')::date;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_ai_credit(int) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.increment_daily_usage(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.reset_my_daily_ai_usage() FROM anon, public;

GRANT EXECUTE ON FUNCTION public.consume_ai_credit(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_daily_usage(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_my_daily_ai_usage() TO authenticated;