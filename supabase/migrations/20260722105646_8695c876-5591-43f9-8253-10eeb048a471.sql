REVOKE ALL ON FUNCTION public.get_group_by_code(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_group_by_code(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_group_by_code(text) TO authenticated;

REVOKE ALL ON FUNCTION public.join_group_by_code(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.join_group_by_code(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.join_group_by_code(text) TO authenticated;

REVOKE ALL ON FUNCTION public.is_group_member(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_group_member(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.is_group_admin(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_group_admin(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) TO service_role;
