ALTER TABLE public.profiles ADD COLUMN paddle_customer_id text, ADD COLUMN paddle_subscription_id text, ADD COLUMN paddle_environment text;
CREATE UNIQUE INDEX profiles_paddle_customer_idx ON public.profiles(paddle_environment, paddle_customer_id) WHERE paddle_customer_id IS NOT NULL;
CREATE FUNCTION public.protect_profile_billing() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN
 IF (NEW.paddle_customer_id IS DISTINCT FROM OLD.paddle_customer_id OR NEW.paddle_subscription_id IS DISTINCT FROM OLD.paddle_subscription_id OR NEW.paddle_environment IS DISTINCT FROM OLD.paddle_environment) AND current_user NOT IN ('service_role','postgres','supabase_admin') THEN RAISE EXCEPTION 'billing can only be changed by the server' USING ERRCODE='42501'; END IF; RETURN NEW; END $$;
CREATE TRIGGER profiles_protect_billing BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_billing();
CREATE TABLE public.paddle_catalog(environment text NOT NULL CHECK(environment IN ('production','sandbox')), plan text NOT NULL CHECK(plan IN ('pro','studio')), product_id text, price_id text, lease_token uuid, lease_until timestamptz, PRIMARY KEY(environment,plan));
GRANT ALL ON public.paddle_catalog TO service_role;
ALTER TABLE public.paddle_catalog ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.paddle_catalog FROM anon, authenticated;
CREATE TABLE public.paddle_subscriptions(id text PRIMARY KEY, user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, environment text NOT NULL CHECK(environment IN ('production','sandbox')), customer_id text NOT NULL, plan text NOT NULL CHECK(plan IN ('free','pro','studio')), status text NOT NULL, next_billed_at timestamptz, event_at timestamptz NOT NULL);
GRANT ALL ON public.paddle_subscriptions TO service_role;
ALTER TABLE public.paddle_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.paddle_subscriptions FROM anon, authenticated;
CREATE INDEX paddle_subscriptions_user_idx ON public.paddle_subscriptions(user_id,environment);
CREATE TABLE public.paddle_events(event_id text PRIMARY KEY, occurred_at timestamptz NOT NULL, received_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.paddle_events TO service_role;
ALTER TABLE public.paddle_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.paddle_events FROM anon, authenticated;
CREATE FUNCTION public.claim_paddle_catalog(p_environment text, p_plan text, p_token uuid) RETURNS boolean LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 INSERT INTO public.paddle_catalog(environment,plan,lease_token,lease_until) VALUES(p_environment,p_plan,p_token,now()+interval '90 seconds') ON CONFLICT(environment,plan) DO UPDATE SET lease_token=p_token,lease_until=now()+interval '90 seconds' WHERE paddle_catalog.price_id IS NULL AND (paddle_catalog.lease_until IS NULL OR paddle_catalog.lease_until < now()); RETURN FOUND; END $$;
REVOKE ALL ON FUNCTION public.claim_paddle_catalog(text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_paddle_catalog(text,text,uuid) TO service_role;
CREATE FUNCTION public.apply_paddle_subscription(p_event_id text,p_occurred_at timestamptz,p_user_id uuid,p_environment text,p_customer_id text,p_subscription_id text,p_plan text,p_status text,p_next_billed_at timestamptz) RETURNS text LANGUAGE plpgsql SET search_path=public AS $$
DECLARE existing public.profiles; effective public.paddle_subscriptions;
BEGIN
 SELECT * INTO existing FROM public.profiles WHERE id=p_user_id FOR UPDATE;
 IF NOT FOUND OR existing.paddle_customer_id IS DISTINCT FROM p_customer_id OR existing.paddle_environment IS DISTINCT FROM p_environment THEN RAISE EXCEPTION 'billing owner mismatch'; END IF;
 INSERT INTO public.paddle_events(event_id,occurred_at) VALUES(p_event_id,p_occurred_at) ON CONFLICT DO NOTHING;
 IF NOT FOUND THEN RETURN 'duplicate'; END IF;
 INSERT INTO public.paddle_subscriptions(id,user_id,environment,customer_id,plan,status,next_billed_at,event_at) VALUES(p_subscription_id,p_user_id,p_environment,p_customer_id,p_plan,p_status,p_next_billed_at,p_occurred_at)
 ON CONFLICT(id) DO UPDATE SET plan=EXCLUDED.plan,status=EXCLUDED.status,next_billed_at=EXCLUDED.next_billed_at,event_at=EXCLUDED.event_at WHERE paddle_subscriptions.user_id=p_user_id AND paddle_subscriptions.environment=p_environment AND paddle_subscriptions.event_at < p_occurred_at;
 IF NOT FOUND THEN RETURN 'stale'; END IF;
 SELECT * INTO effective FROM public.paddle_subscriptions WHERE user_id=p_user_id AND environment=p_environment AND plan IN ('pro','studio') ORDER BY CASE WHEN plan='studio' THEN 0 ELSE 1 END,event_at DESC LIMIT 1;
 IF FOUND THEN UPDATE public.profiles SET plan=effective.plan,plan_renews_at=effective.next_billed_at,paddle_subscription_id=effective.id WHERE id=p_user_id;
 ELSE UPDATE public.profiles SET plan='free',plan_renews_at=NULL,paddle_subscription_id=p_subscription_id WHERE id=p_user_id; END IF;
 RETURN 'applied';
END $$;
REVOKE ALL ON FUNCTION public.apply_paddle_subscription(text,timestamptz,uuid,text,text,text,text,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_paddle_subscription(text,timestamptz,uuid,text,text,text,text,text,timestamptz) TO service_role;