-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Herkes görev oluşturabilir" ON public.tasks;

-- Create new simplified INSERT policy for authenticated users
CREATE POLICY "Authenticated users can create tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Function to automatically set created_by
CREATE OR REPLACE FUNCTION public.set_task_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: missing auth uid';
  END IF;

  -- Override any client-provided value with the authenticated user's ID
  NEW.created_by := auth.uid();

  RETURN NEW;
END;
$$;

-- Create trigger to auto-set created_by before insert
DROP TRIGGER IF EXISTS trg_tasks_set_created_by ON public.tasks;
CREATE TRIGGER trg_tasks_set_created_by
BEFORE INSERT ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_task_created_by();