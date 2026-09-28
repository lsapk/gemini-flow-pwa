DROP TABLE IF EXISTS public.shared_tasks CASCADE;
DROP TABLE IF EXISTS public.shared_habits CASCADE;
DROP TABLE IF EXISTS public.shared_goals CASCADE;
DROP TABLE IF EXISTS public.group_messages CASCADE;
DROP TABLE IF EXISTS public.group_invitations CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;

DROP FUNCTION IF EXISTS public.get_leaderboard(text, integer);
DROP FUNCTION IF EXISTS public.join_group_by_code(text);
DROP FUNCTION IF EXISTS public.get_group_by_code(text);
DROP FUNCTION IF EXISTS public.create_group(text, text);
DROP FUNCTION IF EXISTS public.is_group_admin(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_group_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.generate_group_invite_code() CASCADE;
DROP FUNCTION IF EXISTS public.set_group_invite_code() CASCADE;
DROP FUNCTION IF EXISTS public.set_group_created_by() CASCADE;
DROP FUNCTION IF EXISTS public.add_group_creator_as_admin() CASCADE;