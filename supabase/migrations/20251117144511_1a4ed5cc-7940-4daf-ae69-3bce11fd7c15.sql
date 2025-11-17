-- Audit Logs Tablosu (Tüm işlemler loglanacak)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Audit Logs için RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sadece adminler ve managerlar audit logları görebilir"
ON public.audit_logs FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager')
);

-- Rol İzinleri Tablosu (Her rol için özel izinler)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  resource text NOT NULL, -- 'tasks', 'users', 'departments', 'production_orders', etc.
  can_create boolean DEFAULT false,
  can_read boolean DEFAULT false,
  can_update boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(role, resource)
);

-- Role Permissions için RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes rol izinlerini görebilir"
ON public.role_permissions FOR SELECT
USING (true);

CREATE POLICY "Sadece adminler rol izinlerini oluşturabilir"
ON public.role_permissions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Sadece adminler rol izinlerini güncelleyebilir"
ON public.role_permissions FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Sadece adminler rol izinlerini silebilir"
ON public.role_permissions FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Varsayılan rol izinlerini ekle
INSERT INTO public.role_permissions (role, resource, can_create, can_read, can_update, can_delete) VALUES
-- Admin: Hepsini yapabilir
('admin', 'tasks', true, true, true, true),
('admin', 'users', true, true, true, true),
('admin', 'departments', true, true, true, true),
('admin', 'production_orders', true, true, true, true),
('admin', 'production_processes', true, true, true, true),
('admin', 'audit_logs', false, true, false, false),
('admin', 'role_permissions', true, true, true, true),

-- Manager: Çoğu şeyi yapabilir, user silme hariç
('manager', 'tasks', true, true, true, true),
('manager', 'users', false, true, true, false),
('manager', 'departments', true, true, true, false),
('manager', 'production_orders', true, true, true, true),
('manager', 'production_processes', true, true, true, true),
('manager', 'audit_logs', false, true, false, false),
('manager', 'role_permissions', false, true, false, false),

-- Operator: Sadece görevler ve üretim ile ilgili
('operator', 'tasks', true, true, true, false),
('operator', 'users', false, true, false, false),
('operator', 'departments', false, true, false, false),
('operator', 'production_orders', false, true, true, false),
('operator', 'production_processes', true, true, true, false),
('operator', 'audit_logs', false, false, false, false),
('operator', 'role_permissions', false, true, false, false),

-- Viewer: Sadece okuma
('viewer', 'tasks', false, true, false, false),
('viewer', 'users', false, true, false, false),
('viewer', 'departments', false, true, false, false),
('viewer', 'production_orders', false, true, false, false),
('viewer', 'production_processes', false, true, false, false),
('viewer', 'audit_logs', false, false, false, false),
('viewer', 'role_permissions', false, true, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- Audit log yazmak için fonksiyon
CREATE OR REPLACE FUNCTION public.log_audit(
  _action text,
  _table_name text,
  _record_id uuid,
  _old_data jsonb DEFAULT NULL,
  _new_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    _action,
    _table_name,
    _record_id,
    _old_data,
    _new_data
  );
END;
$$;

-- Tasks için audit trigger
CREATE OR REPLACE FUNCTION public.audit_tasks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit('CREATE', 'tasks', NEW.id, NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit('UPDATE', 'tasks', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit('DELETE', 'tasks', OLD.id, to_jsonb(OLD), NULL);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER tasks_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION audit_tasks();

-- User Roles için audit trigger
CREATE OR REPLACE FUNCTION public.audit_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit('CREATE', 'user_roles', NEW.id, NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit('UPDATE', 'user_roles', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit('DELETE', 'user_roles', OLD.id, to_jsonb(OLD), NULL);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER user_roles_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION audit_user_roles();

-- Departments için audit trigger
CREATE OR REPLACE FUNCTION public.audit_departments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit('CREATE', 'departments', NEW.id, NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit('UPDATE', 'departments', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit('DELETE', 'departments', OLD.id, to_jsonb(OLD), NULL);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER departments_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.departments
FOR EACH ROW EXECUTE FUNCTION audit_departments();

-- Production Orders için audit trigger
CREATE OR REPLACE FUNCTION public.audit_production_orders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit('CREATE', 'production_orders', NEW.id, NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit('UPDATE', 'production_orders', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit('DELETE', 'production_orders', OLD.id, to_jsonb(OLD), NULL);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER production_orders_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.production_orders
FOR EACH ROW EXECUTE FUNCTION audit_production_orders();

-- Indeksler (performans için)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);