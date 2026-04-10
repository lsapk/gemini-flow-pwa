
-- Fix SECURITY DEFINER views — change to SECURITY INVOKER
ALTER VIEW public.user_safe_view SET (security_invoker = on);
ALTER VIEW public.google_calendar_tokens_safe SET (security_invoker = on);
ALTER VIEW public.google_tasks_tokens_safe SET (security_invoker = on);
