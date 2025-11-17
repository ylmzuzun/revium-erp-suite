-- Kullanıcı rolleri için enum
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'operator', 'viewer');

-- Görev durumları için enum
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Üretim sipariş durumları için enum
CREATE TYPE public.production_status AS ENUM ('planned', 'in_production', 'quality_check', 'completed', 'on_hold');

-- Kullanıcı profilleri tablosu
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  department_id UUID,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kullanıcı rolleri tablosu (güvenlik için ayrı tablo)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Rol kontrolü için güvenli fonksiyon
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Departmanlar tablosu
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profillere department foreign key ekle
ALTER TABLE public.profiles 
ADD CONSTRAINT fk_department 
FOREIGN KEY (department_id) REFERENCES public.departments(id);

-- Üretim siparişleri tablosu
CREATE TABLE public.production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  customer_name TEXT,
  status production_status NOT NULL DEFAULT 'planned',
  priority INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ NOT NULL,
  completed_date TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Üretim süreçleri tablosu
CREATE TABLE public.production_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  process_name TEXT NOT NULL,
  description TEXT,
  sequence_order INTEGER NOT NULL,
  assigned_department UUID REFERENCES public.departments(id),
  status task_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Görevler tablosu
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  production_order_id UUID REFERENCES public.production_orders(id),
  production_process_id UUID REFERENCES public.production_processes(id),
  status task_status NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  due_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Görev atamaları tablosu
CREATE TABLE public.task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES auth.users(id),
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(task_id, assigned_to)
);

-- Dosya paylaşımı tablosu
CREATE TABLE public.shared_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  description TEXT,
  production_order_id UUID REFERENCES public.production_orders(id),
  task_id UUID REFERENCES public.tasks(id),
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar kendi profilini görebilir"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Kullanıcılar kendi profilini güncelleyebilir"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Herkes diğer profilleri görebilir"
  ON public.profiles FOR SELECT
  USING (true);

-- User Roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Adminler tüm rolleri görebilir"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Adminler rol atayabilir"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes departmanları görebilir"
  ON public.departments FOR SELECT
  USING (true);

CREATE POLICY "Adminler ve managerlar departman oluşturabilir"
  ON public.departments FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Adminler ve managerlar departman güncelleyebilir"
  ON public.departments FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'manager')
  );

-- Production Orders
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes üretim siparişlerini görebilir"
  ON public.production_orders FOR SELECT
  USING (true);

CREATE POLICY "Adminler ve managerlar sipariş oluşturabilir"
  ON public.production_orders FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Adminler ve managerlar sipariş güncelleyebilir"
  ON public.production_orders FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'manager')
  );

-- Production Processes
ALTER TABLE public.production_processes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes üretim süreçlerini görebilir"
  ON public.production_processes FOR SELECT
  USING (true);

CREATE POLICY "Adminler, managerlar ve operatörler süreç oluşturabilir"
  ON public.production_processes FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'operator')
  );

CREATE POLICY "Adminler, managerlar ve operatörler süreç güncelleyebilir"
  ON public.production_processes FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'operator')
  );

-- Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes görevleri görebilir"
  ON public.tasks FOR SELECT
  USING (true);

CREATE POLICY "Herkes görev oluşturabilir"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Görev oluşturan ve atananlar güncelleyebilir"
  ON public.tasks FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.task_assignments
      WHERE task_id = tasks.id AND assigned_to = auth.uid()
    )
  );

-- Task Assignments
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes atamalarını görebilir"
  ON public.task_assignments FOR SELECT
  USING (true);

CREATE POLICY "Herkes görev atayabilir"
  ON public.task_assignments FOR INSERT
  WITH CHECK (auth.uid() = assigned_by);

CREATE POLICY "Atayan güncelleyebilir"
  ON public.task_assignments FOR UPDATE
  USING (auth.uid() = assigned_by OR auth.uid() = assigned_to);

-- Shared Files
ALTER TABLE public.shared_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes dosyaları görebilir"
  ON public.shared_files FOR SELECT
  USING (true);

CREATE POLICY "Herkes dosya yükleyebilir"
  ON public.shared_files FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

-- Otomatik profil oluşturma trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- İlk kullanıcıya admin rolü ver
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Diğer kullanıcılara operator rolü ver
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'operator');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Tüm tablolara updated_at trigger ekle
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.production_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.production_processes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();