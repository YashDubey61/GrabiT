-- GrabIt — Day 63: Order Cancellation Refund & Ledger Integrity Migration
-- Source of truth: TRD §8 Security Architecture & TRD §4 Data Model (Financial Ledger & Refunds)

-- 1. Atomic PostgreSQL RPC function for order cancellation refunds with row locking
CREATE OR REPLACE FUNCTION public.refund_student_wallet(
  p_order_id uuid,
  p_reason text DEFAULT 'Order cancelled by store'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_payment payments%ROWTYPE;
  v_wallet wallets%ROWTYPE;
  v_existing_tx_count int;
  v_amount numeric;
  v_new_balance numeric;
BEGIN
  -- 1. Fetch and lock order
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'Order not found');
  END IF;

  -- 2. Fetch and lock payment for this order
  SELECT * INTO v_payment
  FROM payments
  WHERE order_id = p_order_id
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'No payment record found for order');
  END IF;

  -- 3. Check if already refunded (Idempotency Guard)
  IF v_payment.status = 'refunded' THEN
    RETURN json_build_object(
      'ok', true,
      'already_refunded', true,
      'amount', v_payment.amount,
      'message', 'Payment has already been refunded'
    );
  END IF;

  -- Check if a refund transaction already exists in the ledger for this order
  SELECT count(*) INTO v_existing_tx_count
  FROM wallet_transactions
  WHERE related_order_id = p_order_id AND type = 'refund';

  IF v_existing_tx_count > 0 THEN
    -- Ledger already recorded refund, update payment status to match
    UPDATE payments SET status = 'refunded', updated_at = now() WHERE id = v_payment.id;
    RETURN json_build_object(
      'ok', true,
      'already_refunded', true,
      'amount', v_payment.amount,
      'message', 'Refund transaction already recorded in ledger'
    );
  END IF;

  -- 4. Check if payment was actually successful / captured
  IF v_payment.status != 'success' THEN
    RETURN json_build_object(
      'ok', false,
      'error', format('Payment status is "%s" (not "success"), no refund issued', v_payment.status)
    );
  END IF;

  v_amount := v_payment.amount;

  -- If amount is 0 (e.g. 100% discount promo/reward code), mark refunded without wallet balance change
  IF v_amount <= 0 THEN
    UPDATE payments SET status = 'refunded', updated_at = now() WHERE id = v_payment.id;
    RETURN json_build_object(
      'ok', true,
      'refunded', true,
      'amount', 0,
      'new_balance', NULL
    );
  END IF;

  -- 5. Lock or create student's wallet
  SELECT * INTO v_wallet
  FROM wallets
  WHERE user_id = v_order.student_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO wallets (user_id, balance, updated_at)
    VALUES (v_order.student_id, 0, now())
    RETURNING * INTO v_wallet;
  END IF;

  v_new_balance := v_wallet.balance + v_amount;

  -- 6. Credit wallet balance
  UPDATE wallets
  SET balance = v_new_balance,
      updated_at = now()
  WHERE id = v_wallet.id;

  -- 7. Insert refund transaction into append-only ledger
  INSERT INTO wallet_transactions (
    wallet_id,
    type,
    amount,
    related_order_id,
    created_at
  ) VALUES (
    v_wallet.id,
    'refund',
    v_amount,
    p_order_id,
    now()
  );

  -- 8. Mark payment as refunded
  UPDATE payments
  SET status = 'refunded',
      updated_at = now()
  WHERE id = v_payment.id;

  RETURN json_build_object(
    'ok', true,
    'refunded', true,
    'amount', v_amount,
    'new_balance', v_new_balance
  );
END;
$$;

-- Security hardening: revoke public/anon/authenticated execution and restrict to service_role
REVOKE EXECUTE ON FUNCTION public.refund_student_wallet(uuid, text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.refund_student_wallet(uuid, text) TO service_role;
ALTER FUNCTION public.refund_student_wallet(uuid, text) SET search_path = public, pg_temp;
