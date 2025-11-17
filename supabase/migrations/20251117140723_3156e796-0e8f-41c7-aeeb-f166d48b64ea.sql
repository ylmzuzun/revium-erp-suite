-- Bildirimler tablosu oluştur
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS aktif et
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi bildirimlerini görebilir
CREATE POLICY "Kullanıcılar sadece kendi bildirimlerini görebilir"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Kullanıcılar kendi bildirimlerini güncelleyebilir (okundu işaretleme için)
CREATE POLICY "Kullanıcılar kendi bildirimlerini güncelleyebilir"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Bildirim oluşturma (sistem için)
CREATE POLICY "Kimlik doğrulanmış kullanıcılar bildirim oluşturabilir"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Tasks tablosu için RLS güncelle
DROP POLICY IF EXISTS "Herkes görevleri görebilir" ON public.tasks;

CREATE POLICY "Kullanıcılar sadece kendi görevlerini görebilir"
ON public.tasks FOR SELECT
USING (
  auth.uid() = created_by 
  OR 
  EXISTS (
    SELECT 1 FROM public.task_assignments 
    WHERE task_assignments.task_id = tasks.id 
    AND task_assignments.assigned_to = auth.uid()
  )
);

-- Task assignments tablosu için RLS güncelle
DROP POLICY IF EXISTS "Herkes atamalarını görebilir" ON public.task_assignments;

CREATE POLICY "Sadece ilgili kişiler atamaları görebilir"
ON public.task_assignments FOR SELECT
USING (
  auth.uid() = assigned_to 
  OR 
  auth.uid() = assigned_by
  OR
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_assignments.task_id 
    AND tasks.created_by = auth.uid()
  )
);

-- Realtime için notifications tablosunu ekle
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;