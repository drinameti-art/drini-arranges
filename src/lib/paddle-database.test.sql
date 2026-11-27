-- Rollback-only integration test. Supply a temporary account via app.test_user_id.
-- Never run against a paying customer; no changes survive this transaction.
BEGIN;
SELECT set_config('app.test_user_id', :'test_user_id', true);
UPDATE public.profiles SET paddle_customer_id='ctm_paddle_db_test',paddle_environment='production',plan='free',plan_renews_at=NULL WHERE id=current_setting('app.test_user_id')::uuid;
DO $$
DECLARE uid uuid := current_setting('app.test_user_id')::uuid; payload jsonb; result text; actual text;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=uid) THEN RAISE EXCEPTION 'temporary account missing'; END IF;
 payload:=jsonb_build_object('event_id','evt_paddle_db_test_1','occurred_at','2026-11-27T16:00:00Z','user_id',uid,'environment','production','customer_id','ctm_paddle_db_test','subscription_id','sub_paddle_db_test_1','plan','pro','status','active','next_billed_at','2026-12-04T16:00:00Z');
 result:=public.apply_paddle_billing(payload);
 IF result <> 'applied' THEN RAISE EXCEPTION 'event not applied'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=uid AND plan='pro' AND plan_renews_at='2026-12-04T16:00:00Z'::timestamptz) THEN RAISE EXCEPTION 'Pro renewal mapping failed'; END IF;
 IF public.apply_paddle_billing(payload) <> 'duplicate' THEN RAISE EXCEPTION 'duplicate not ignored'; END IF;
 result:=public.apply_paddle_billing(payload || jsonb_build_object('event_id','evt_paddle_db_test_2','occurred_at','2026-11-26T16:00:00Z','plan','free','status','canceled','next_billed_at',NULL));
 IF result <> 'stale' THEN RAISE EXCEPTION 'older event not ignored'; END IF;
 SELECT plan INTO actual FROM public.profiles WHERE id=uid;
 IF actual <> 'pro' THEN RAISE EXCEPTION 'stale cancellation removed access'; END IF;
 PERFORM public.apply_paddle_billing(payload || jsonb_build_object('event_id','evt_paddle_db_test_3','occurred_at','2026-11-27T16:01:00Z','subscription_id','sub_paddle_db_test_2','plan','studio','next_billed_at','2026-12-27T16:00:00Z'));
 SELECT plan INTO actual FROM public.profiles WHERE id=uid;
 IF actual <> 'studio' THEN RAISE EXCEPTION 'Studio mapping failed'; END IF;
 PERFORM public.apply_paddle_billing(payload || jsonb_build_object('event_id','evt_paddle_db_test_4','occurred_at','2026-11-27T16:02:00Z','plan','free','status','canceled','next_billed_at',NULL));
 SELECT plan INTO actual FROM public.profiles WHERE id=uid;
 IF actual <> 'studio' THEN RAISE EXCEPTION 'canceled older subscription removed active Studio'; END IF;
 PERFORM public.apply_paddle_billing(payload || jsonb_build_object('event_id','evt_paddle_db_test_5','occurred_at','2026-11-27T16:03:00Z','subscription_id','sub_paddle_db_test_2','plan','free','status','paused','next_billed_at',NULL));
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=uid AND plan='free' AND plan_renews_at IS NULL) THEN RAISE EXCEPTION 'effective pause did not revert to Free'; END IF;
 BEGIN
  PERFORM public.apply_paddle_billing(payload || jsonb_build_object('event_id','evt_paddle_db_test_6','customer_id','ctm_someone_else'));
  RAISE EXCEPTION 'owner mismatch accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'billing owner mismatch' THEN RAISE; END IF; END;
 IF has_function_privilege('authenticated','public.apply_paddle_billing(jsonb)','EXECUTE') THEN RAISE EXCEPTION 'users can apply billing events'; END IF;
 IF has_column_privilege('authenticated','public.profiles','plan','UPDATE') THEN RAISE EXCEPTION 'users can update plans'; END IF;
 IF has_column_privilege('authenticated','public.profiles','paddle_customer_id','UPDATE') THEN RAISE EXCEPTION 'users can change billing owner'; END IF;
END $$;
ROLLBACK;