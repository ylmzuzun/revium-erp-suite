-- ADIM 1: Tasks için security definer function oluştur (sonsuz döngüyü önler)
CREATE OR REPLACE FUNCTION public.can_view_task(_user_id uuid, _task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Görev oluşturduysam
    SELECT 1 FROM tasks 
    WHERE id = _task_id AND created_by = _user_id
    
    UNION
    
    -- Bana atanmışsa
    SELECT 1 FROM task_assignments
    WHERE task_id = _task_id AND assigned_to = _user_id
  )
$$;

-- ADIM 2: Tasks policy'lerini düzelt (sonsuz döngü problemi)
DROP POLICY IF EXISTS "Kullanıcılar sadece kendi görevlerini görebilir" ON tasks;
DROP POLICY IF EXISTS "Görev oluşturan ve atananlar güncelleyebilir" ON tasks;

CREATE POLICY "Kullanıcılar sadece kendi görevlerini görebilir" ON tasks
FOR SELECT
USING (can_view_task(auth.uid(), id));

CREATE POLICY "Görev oluşturan ve atananlar güncelleyebilir" ON tasks
FOR UPDATE
USING (can_view_task(auth.uid(), id))
WITH CHECK (can_view_task(auth.uid(), id));

-- ADIM 3: DELETE policy'leri ekle

-- Departments: Sadece adminler silebilir
CREATE POLICY "Adminler departman silebilir"
ON departments FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- User Roles: Adminler rol silebilir (kendi rolü hariç)
CREATE POLICY "Adminler rol silebilir"
ON user_roles FOR DELETE
USING (
  has_role(auth.uid(), 'admin')
  AND user_id != auth.uid()
);

-- User Roles: Adminler rol güncelleyebilir
CREATE POLICY "Adminler rol güncelleyebilir"
ON user_roles FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Tasks: Görev oluşturan silebilir
CREATE POLICY "Görev oluşturan silebilir"
ON tasks FOR DELETE
USING (auth.uid() = created_by);

-- Production Orders: Adminler ve managerlar silebilir
CREATE POLICY "Adminler ve managerlar sipariş silebilir"
ON production_orders FOR DELETE
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'manager')
);

-- Production Processes: Adminler ve managerlar silebilir
CREATE POLICY "Adminler ve managerlar süreç silebilir"
ON production_processes FOR DELETE
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'manager')
);

-- Notifications: Kullanıcılar kendi bildirimlerini silebilir
CREATE POLICY "Kullanıcılar kendi bildirimlerini silebilir"
ON notifications FOR DELETE
USING (auth.uid() = user_id);

-- Shared Files: Yükleyen veya admin silebilir
CREATE POLICY "Yükleyen veya admin dosya silebilir"
ON shared_files FOR DELETE
USING (
  auth.uid() = uploaded_by
  OR has_role(auth.uid(), 'admin')
);

-- Task Assignments: Atayan veya görev sahibi silebilir
CREATE POLICY "Atayan veya görev sahibi atamayı silebilir"
ON task_assignments FOR DELETE
USING (
  auth.uid() = assigned_by
  OR EXISTS (
    SELECT 1 FROM tasks 
    WHERE tasks.id = task_assignments.task_id 
    AND tasks.created_by = auth.uid()
  )
);

-- ADIM 4: Profiles UPDATE policy'sini genişlet
CREATE POLICY "Adminler ve managerlar profil güncelleyebilir"
ON profiles FOR UPDATE
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'manager')
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'manager')
);