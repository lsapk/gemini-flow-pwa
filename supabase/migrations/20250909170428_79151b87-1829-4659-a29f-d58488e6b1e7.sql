-- Fix function search path security issues

-- Update existing functions to have proper search_path
ALTER FUNCTION public.auth_user_is_admin() SET search_path = public;
ALTER FUNCTION public.is_authenticated() SET search_path = public, auth;  
ALTER FUNCTION public.handle_new_user() SET search_path = public, auth;
ALTER FUNCTION public.reorder_items() SET search_path = public;