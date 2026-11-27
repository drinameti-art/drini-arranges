REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.arrangement_usage FROM authenticated, anon;
REVOKE ALL ON public.arrangement_usage FROM anon;