-- 0058 revoked EXECUTE from anon/authenticated directly, but the actual
-- grant Postgres creates for a new function defaults to PUBLIC (visible
-- as the `=X` entry in pg_proc.proacl) — every role, including
-- anon/authenticated, inherits PUBLIC's privileges regardless of a
-- per-role revoke. That left the direct-RPC exposure fully open. This
-- revokes from PUBLIC (the only thing that actually removes it) and
-- re-grants explicitly to service_role, matching how the app always
-- invokes these functions in practice.

revoke execute on function public.debit_student_wallet(uuid, numeric, uuid) from public;
revoke execute on function public.create_wallet_topup_intent(uuid, numeric, text) from public;
revoke execute on function public.confirm_wallet_topup(text, text, text) from public;
revoke execute on function public.create_gold_pass_payment_intent(uuid, text, numeric, text) from public;
revoke execute on function public.confirm_gold_pass_payment(text, text, text) from public;
revoke execute on function public.create_fund_addition(uuid, numeric, text) from public;
revoke execute on function public.confirm_fund_addition(text, text, text) from public;
revoke execute on function public.initiate_vendor_payout(uuid, uuid, text, text, numeric) from public;
revoke execute on function public.confirm_vendor_payout(text, text, text) from public;
revoke execute on function public.settle_redemption(uuid, uuid, numeric, text, text) from public;
revoke execute on function public.get_financial_ledger_summary(timestamptz, timestamptz) from public;
revoke execute on function public.get_payout_wallet_balance() from public;
revoke execute on function public.get_points_liability_breakdown() from public;
revoke execute on function public.get_gifting_analytics(timestamptz, timestamptz) from public;
revoke execute on function public.get_leaderboard_economics(timestamptz, timestamptz) from public;
revoke execute on function public.get_redemption_lifecycle_stats(timestamptz, timestamptz, uuid) from public;
revoke execute on function public.get_reward_cost_breakdown(timestamptz, timestamptz, uuid) from public;
revoke execute on function public.get_rewards_kpis(timestamptz, timestamptz, uuid) from public;
revoke execute on function public.get_rewards_timeseries(timestamptz, timestamptz, uuid) from public;
revoke execute on function public.get_vendor_rewards_performance(timestamptz, timestamptz) from public;
revoke execute on function public.award_order_points(uuid) from public;
revoke execute on function public.redeem_reward(uuid, uuid, uuid) from public;
revoke execute on function public.transfer_points(uuid, uuid, integer) from public;
revoke execute on function public.redeem_promo_code(text, uuid, uuid, numeric, uuid, uuid) from public;
revoke execute on function public.preview_promo_code(text, uuid, numeric, uuid, uuid) from public;
revoke execute on function public.get_active_promo_codes(uuid) from public;
revoke execute on function public.consume_reward_code(text, uuid, uuid) from public;
revoke execute on function public.mark_redemption_used(text, uuid, uuid) from public;
revoke execute on function public.verify_redemption_code(text, uuid) from public;
revoke execute on function public.preview_reward_code(text, uuid) from public;

grant execute on function public.debit_student_wallet(uuid, numeric, uuid) to service_role;
grant execute on function public.create_wallet_topup_intent(uuid, numeric, text) to service_role;
grant execute on function public.confirm_wallet_topup(text, text, text) to service_role;
grant execute on function public.create_gold_pass_payment_intent(uuid, text, numeric, text) to service_role;
grant execute on function public.confirm_gold_pass_payment(text, text, text) to service_role;
grant execute on function public.create_fund_addition(uuid, numeric, text) to service_role;
grant execute on function public.confirm_fund_addition(text, text, text) to service_role;
grant execute on function public.initiate_vendor_payout(uuid, uuid, text, text, numeric) to service_role;
grant execute on function public.confirm_vendor_payout(text, text, text) to service_role;
grant execute on function public.settle_redemption(uuid, uuid, numeric, text, text) to service_role;
grant execute on function public.get_financial_ledger_summary(timestamptz, timestamptz) to service_role;
grant execute on function public.get_payout_wallet_balance() to service_role;
grant execute on function public.get_points_liability_breakdown() to service_role;
grant execute on function public.get_gifting_analytics(timestamptz, timestamptz) to service_role;
grant execute on function public.get_leaderboard_economics(timestamptz, timestamptz) to service_role;
grant execute on function public.get_redemption_lifecycle_stats(timestamptz, timestamptz, uuid) to service_role;
grant execute on function public.get_reward_cost_breakdown(timestamptz, timestamptz, uuid) to service_role;
grant execute on function public.get_rewards_kpis(timestamptz, timestamptz, uuid) to service_role;
grant execute on function public.get_rewards_timeseries(timestamptz, timestamptz, uuid) to service_role;
grant execute on function public.get_vendor_rewards_performance(timestamptz, timestamptz) to service_role;
grant execute on function public.award_order_points(uuid) to service_role;
grant execute on function public.redeem_reward(uuid, uuid, uuid) to service_role;
grant execute on function public.transfer_points(uuid, uuid, integer) to service_role;
grant execute on function public.redeem_promo_code(text, uuid, uuid, numeric, uuid, uuid) to service_role;
grant execute on function public.preview_promo_code(text, uuid, numeric, uuid, uuid) to service_role;
grant execute on function public.get_active_promo_codes(uuid) to service_role;
grant execute on function public.consume_reward_code(text, uuid, uuid) to service_role;
grant execute on function public.mark_redemption_used(text, uuid, uuid) to service_role;
grant execute on function public.verify_redemption_code(text, uuid) to service_role;
grant execute on function public.preview_reward_code(text, uuid) to service_role;
