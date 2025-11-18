-- ============================================
-- 1) Eski FK constraint'leri varsa temizle
-- ============================================

alter table public.task_assignments
  drop constraint if exists task_assignments_task_id_fkey,
  drop constraint if exists task_assignments_assigned_to_fkey,
  drop constraint if exists task_assignments_assigned_by_fkey;


-- ============================================
-- 2) task_id -> tasks.id FK
-- ============================================

alter table public.task_assignments
  add constraint task_assignments_task_id_fkey
  foreign key (task_id)
  references public.tasks (id)
  on delete cascade;


-- ============================================
-- 3) assigned_to -> profiles.id FK
-- ============================================

alter table public.task_assignments
  add constraint task_assignments_assigned_to_fkey
  foreign key (assigned_to)
  references public.profiles (id)
  on delete cascade;


-- ============================================
-- 4) assigned_by -> profiles.id FK
-- ============================================

alter table public.task_assignments
  add constraint task_assignments_assigned_by_fkey
  foreign key (assigned_by)
  references public.profiles (id)
  on delete set null;