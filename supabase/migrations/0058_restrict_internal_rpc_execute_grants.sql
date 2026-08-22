-- Security hardening: several SECURITY DEFINER functions are money-moving
-- (wallet debit/credit, gold-pass/vendor-payout confirmation, fund-ledger
-- writes) or admin-only analytics, and are called EXCLUSIVELY by app code
-- through the service-role client after the caller's session/role has
-- already been verified in the API route. Supabase grants EXECUTE on new
-- public-schema functions to PUBLIC (anon + authenticated) by default,
-- which means every one of these was also directly callable via
-- /rest/v1/rpc/<fn> by any anon or authenticated caller, bypassing all
-- app-level auth entirely (e.g. debit_student_wallet trusts a raw
-- p_user_id/p_amount with no auth.uid() check; confirm_wallet_topup /
-- confirm_gold_pass_payment / confirm_vendor_payout / confirm_fund_addition
-- have no re-verification that the caller is the trusted webhook handler).
-- Revoking anon/authenticated EXECUTE removes the direct-RPC attack
-- surface without touching function bodies or app behavior — service_role
-- is unaffected by these grants.

revoke execute on function public.debit_student_wallet(uuid, numeric, uuid) from anon, authenticated;
revoke execute on function public.create_wallet_topup_intent(uuid, numeric, text) from anon, authenticated;
revoke execute on function public.confirm_wallet_topup(text, text, text) from anon, authenticated;
revoke execute on function public.create_gold_pass_payment_intent(uuid, text, numeric, text) from anon, authenticated;
revoke execute on function public.confirm_gold_pass_payment(text, text, text) from anon, authenticated;
revoke execute on function public.create_fund_addition(uuid, numeric, text) from anon, authenticated;
revoke execute on function public.confirm_fund_addition(text, text, text) from anon, authenticated;
revoke execute on function public.initiate_vendor_payout(uuid, uuid, text, text, numeric) from anon, authenticated;
revoke execute on function public.confirm_vendor_payout(text, text, text) from anon, authenticated;
revoke execute on function public.settle_redemption(uuid, uuid, numeric, text, text) from anon, authenticated;
revoke execute on function public.get_financial_ledger_summary(timestamptz, timestamptz) from anon, authenticated;
revoke execute on function public.get_payout_wallet_balance() from anon, authenticated;
revoke execute on function public.get_points_liability_breakdown() from anon, authenticated;
revoke execute on function public.get_gifting_analytics(timestamptz, timestamptz) from anon, authenticated;
revoke execute on function public.get_leaderboard_economics(timestamptz, timestamptz) from anon, authenticated;
revoke execute on function public.get_redemption_lifecycle_stats(timestamptz, timestamptz, uuid) from anon, authenticated;
revoke execute on function public.get_reward_cost_breakdown(timestamptz, timestamptz, uuid) from anon, authenticated;
revoke execute on function public.get_rewards_kpis(timestamptz, timestamptz, uuid) from anon, authenticated;
revoke execute on function public.get_rewards_timeseries(timestamptz, timestamptz, uuid) from anon, authenticated;
revoke execute on function public.get_vendor_rewards_performance(timestamptz, timestamptz) from anon, authenticated;
revoke execute on function public.award_order_points(uuid) from anon, authenticated;
revoke execute on function public.redeem_reward(uuid, uuid, uuid) from anon, authenticated;
revoke execute on function public.transfer_points(uuid, uuid, integer) from anon, authenticated;
revoke execute on function public.redeem_promo_code(text, uuid, uuid, numeric, uuid, uuid) from anon, authenticated;
revoke execute on function public.preview_promo_code(text, uuid, numeric, uuid, uuid) from anon, authenticated;
revoke execute on function public.get_active_promo_codes(uuid) from anon, authenticated;
revoke execute on function public.consume_reward_code(text, uuid, uuid) from anon, authenticated;
revoke execute on function public.mark_redemption_used(text, uuid, uuid) from anon, authenticated;
revoke execute on function public.verify_redemption_code(text, uuid) from anon, authenticated;
revoke execute on function public.preview_reward_code(text, uuid) from anon, authenticated;

-- Fix missing search_path on the 3 functions the linter flagged as
-- role-mutable (a search_path-hijacking exposure for SECURITY DEFINER
-- functions specifically; these run in the definer's context so an
-- attacker-controlled search_path could redirect unqualified table/type
-- references to a spoofed object).
alter function public.debit_student_wallet(uuid, numeric, uuid) set search_path = public, pg_temp;
alter function public.generate_grabit_user_id() set search_path = public, pg_temp;
alter function public.set_grabit_user_id_on_insert() set search_path = public, pg_temp;
