-- Restrict profile reads to authenticated users.
-- Run once in Supabase SQL Editor after complete_schema.sql.

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

CREATE POLICY "profiles_select"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
