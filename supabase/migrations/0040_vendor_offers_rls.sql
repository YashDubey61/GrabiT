-- Migration 0040: Vendor Offers & Promo Codes RLS Policies
-- Allows food vendors to read, create, update, and delete promo codes scoped strictly to their own canteen_id

CREATE POLICY "Vendors manage own canteen promo codes" ON public.promo_codes
  FOR ALL USING (
    canteen_id IN (
      SELECT canteen_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Vendors view own canteen promo code redemptions" ON public.promo_code_redemptions
  FOR SELECT USING (
    promo_code_id IN (
      SELECT id FROM public.promo_codes WHERE canteen_id IN (
        SELECT canteen_id FROM public.users WHERE id = auth.uid()
      )
    )
  );
