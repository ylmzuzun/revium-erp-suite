-- Eski INSERT policy'yi sil
DROP POLICY IF EXISTS "Users with valid session can create tasks" ON public.tasks;

-- Yeni, daha güvenli INSERT policy ekle
CREATE POLICY "Users create tasks as themselves"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());