-- Create report_type enum
CREATE TYPE report_type AS ENUM ('sales', 'production', 'customer', 'financial');

-- Create report_format enum  
CREATE TYPE report_format AS ENUM ('pdf', 'excel', 'csv');

-- Create reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  report_type report_type NOT NULL,
  report_format report_format NOT NULL DEFAULT 'pdf',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  file_path TEXT,
  file_size INTEGER,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create audit function for reports FIRST
CREATE OR REPLACE FUNCTION public.audit_reports()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit('CREATE', 'reports', NEW.id, NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit('UPDATE', 'reports', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit('DELETE', 'reports', OLD.id, to_jsonb(OLD), NULL);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Audit trigger
CREATE TRIGGER audit_reports_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION audit_reports();

-- Updated_at trigger
CREATE TRIGGER handle_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- RLS Policies
CREATE POLICY "Herkes rapor oluşturabilir"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Kullanıcılar kendi raporlarını görebilir"
  ON public.reports FOR SELECT
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Kullanıcılar kendi raporlarını silebilir"
  ON public.reports FOR DELETE
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::user_role));

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Kullanıcılar kendi raporlarını yükleyebilir"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Kullanıcılar kendi raporlarını görebilir"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reports' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'::user_role)));

CREATE POLICY "Kullanıcılar kendi raporlarını silebilir"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'reports' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'::user_role)));