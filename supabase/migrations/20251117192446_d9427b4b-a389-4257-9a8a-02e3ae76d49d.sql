-- Replace INSERT policy to avoid role mapping issues
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON public.tasks;

CREATE POLICY "Users with valid session can create tasks"
ON public.tasks
FOR INSERT
TO public
WITH CHECK (auth.uid() IS NOT NULL);