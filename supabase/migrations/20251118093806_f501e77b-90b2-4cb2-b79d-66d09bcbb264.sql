-- ⚠️ WARNING: Disabling RLS on tasks table - This is a SECURITY RISK
-- All tasks will be publicly accessible without any access control
alter table public.tasks disable row level security;