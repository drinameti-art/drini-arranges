ALTER TABLE public.profiles ADD COLUMN plan text NOT NULL DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN plan_renews_at timestamptz NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free','pro','studio'));

-- Users may only edit their display name; plan columns are server-only.
REVOKE UPDATE ON public.profiles FROM authenticated, anon;
GRANT UPDATE (display_name) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.protect_profile_plan()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (NEW.plan IS DISTINCT FROM OLD.plan OR NEW.plan_renews_at IS DISTINCT FROM OLD.plan_renews_at)
     AND current_user NOT IN ('service_role','postgres','supabase_admin') THEN
    RAISE EXCEPTION 'plan can only be changed by the server' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_protect_plan BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_plan();

CREATE TABLE public.arrangement_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX arrangement_usage_user_created_idx ON public.arrangement_usage (user_id, created_at DESC);
GRANT SELECT ON public.arrangement_usage TO authenticated;
GRANT ALL ON public.arrangement_usage TO service_role;
ALTER TABLE public.arrangement_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY arrangement_usage_select_own ON public.arrangement_usage
FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);