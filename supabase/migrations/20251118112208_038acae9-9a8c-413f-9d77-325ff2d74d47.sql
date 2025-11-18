-- ============================================
-- 1) task_assignments için durum ve red sebebi alanları
-- ============================================

alter table public.task_assignments
  add column if not exists status text
    check (status in ('pending', 'accepted', 'rejected', 'completed'))
    default 'pending',
  add column if not exists rejection_reason text;

-- Red durumunda en az 20 karakter açıklama zorunluluğu
alter table public.task_assignments
  drop constraint if exists task_assignments_rejection_reason_length_check;

alter table public.task_assignments
  add constraint task_assignments_rejection_reason_length_check
  check (
    status <> 'rejected'
    or (
      rejection_reason is not null
      and length(rejection_reason) >= 20
    )
  );


-- ============================================
-- 2) Görev kanıtları için ek tablo
-- ============================================

create table if not exists public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null
    references public.tasks (id)
    on delete cascade,
  assignment_id uuid
    references public.task_assignments (id)
    on delete cascade,
  file_path text not null,
  file_name text,
  file_type text,
  created_at timestamptz not null default now(),
  created_by uuid
    references public.profiles (id)
    on delete set null
);