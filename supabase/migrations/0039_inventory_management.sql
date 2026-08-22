-- GrabIt Migration 0039 — Inventory Management & Concurrency Controls
-- Authoritative Stock Source: public.menu_items
-- Inventory Logs Table & Atomic Stock RPC

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 50 CHECK (stock_quantity >= 0),
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 10 CHECK (low_stock_threshold >= 0);

-- Inventory Audit Logs Table
CREATE TABLE IF NOT EXISTS public.inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES public.menu_items (id) ON DELETE CASCADE,
  canteen_id UUID NOT NULL REFERENCES public.canteens (id) ON DELETE CASCADE,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  quantity_changed INTEGER NOT NULL,
  adjustment_type TEXT NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for inventory_logs
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors view own canteen inventory logs"
  ON public.inventory_logs FOR SELECT
  USING (
    canteen_id IN (
      SELECT canteen_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Vendors insert own canteen inventory logs"
  ON public.inventory_logs FOR INSERT
  WITH CHECK (
    canteen_id IN (
      SELECT canteen_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Atomic Inventory Adjustment RPC
CREATE OR REPLACE FUNCTION public.adjust_inventory_stock(
  p_menu_item_id UUID,
  p_quantity_delta INTEGER DEFAULT 0,
  p_exact_quantity INTEGER DEFAULT NULL,
  p_adjustment_type TEXT DEFAULT 'manual_correction',
  p_reason TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  menu_item_id UUID,
  previous_quantity INTEGER,
  new_quantity INTEGER,
  availability TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_new_stock INTEGER;
  v_canteen_id UUID;
  v_qty_changed INTEGER;
BEGIN
  -- 1. Fetch target item with row lock (FOR UPDATE) for race condition protection
  SELECT * INTO v_item
  FROM public.menu_items
  WHERE id = p_menu_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, p_menu_item_id, 0, 0, 'unavailable'::TEXT, 'Menu item not found.'::TEXT;
    RETURN;
  END IF;

  v_canteen_id := v_item.canteen_id;

  -- 2. Calculate new stock
  IF p_exact_quantity IS NOT NULL THEN
    v_new_stock := GREATEST(0, p_exact_quantity);
  ELSE
    v_new_stock := GREATEST(0, v_item.stock_quantity + p_quantity_delta);
  END IF;

  v_qty_changed := v_new_stock - v_item.stock_quantity;

  -- 3. Update menu_items atomically
  UPDATE public.menu_items
  SET
    stock_quantity = v_new_stock,
    availability = CASE WHEN v_new_stock <= 0 THEN 'unavailable'::menu_item_availability ELSE 'available'::menu_item_availability END
  WHERE id = p_menu_item_id;

  -- 4. Log to inventory_logs
  INSERT INTO public.inventory_logs (
    menu_item_id,
    canteen_id,
    previous_quantity,
    new_quantity,
    quantity_changed,
    adjustment_type,
    reason,
    created_by
  ) VALUES (
    p_menu_item_id,
    v_canteen_id,
    v_item.stock_quantity,
    v_new_stock,
    v_qty_changed,
    p_adjustment_type,
    p_reason,
    p_user_id
  );

  RETURN QUERY SELECT
    TRUE,
    p_menu_item_id,
    v_item.stock_quantity,
    v_new_stock,
    (CASE WHEN v_new_stock <= 0 THEN 'unavailable' ELSE 'available' END)::TEXT,
    NULL::TEXT;
END;
$$;
