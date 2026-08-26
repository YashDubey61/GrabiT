-- Migration 0062: Cleanup duplicate active device tokens
-- Ensures each user has at most one active device token by deactivating older duplicates,
-- preserving the most recently active token.

WITH ranked_student_tokens AS (
    SELECT id, user_id,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY last_active_at DESC, updated_at DESC) as rn
    FROM public.student_device_tokens
    WHERE is_active = true
)
UPDATE public.student_device_tokens
SET is_active = false, updated_at = now()
WHERE id IN (
    SELECT id FROM ranked_student_tokens WHERE rn > 1
);

WITH ranked_vendor_tokens AS (
    SELECT id, user_id,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY last_active_at DESC, updated_at DESC) as rn
    FROM public.vendor_device_tokens
    WHERE is_active = true
)
UPDATE public.vendor_device_tokens
SET is_active = false, updated_at = now()
WHERE id IN (
    SELECT id FROM ranked_vendor_tokens WHERE rn > 1
);
