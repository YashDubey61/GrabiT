-- GrabIt — Super Admin Customer Support & Operations Center Migration
-- Source of truth: TRD §4 Data Model & TRD §8 Security Architecture (Support Ticketing & Operational Helpdesk)

-- 1. Extend existing public.support_tickets table schema
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS assigned_admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS canteen_id UUID REFERENCES public.canteens(id) ON DELETE SET NULL;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS sla_status TEXT DEFAULT 'ON_TRACK' CHECK (sla_status IN ('ON_TRACK', 'WARNING', 'BREACHED'));
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS escalation_reason TEXT;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS resolution TEXT;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_admin ON public.support_tickets (assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets (priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_campus ON public.support_tickets (campus_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_canteen ON public.support_tickets (canteen_id);

-- 2. Create support_ticket_messages table for internal notes and customer communications
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('CUSTOMER', 'ADMIN', 'SYSTEM', 'VENDOR')),
  message_type TEXT NOT NULL DEFAULT 'CUSTOMER_MESSAGE' CHECK (message_type IN ('CUSTOMER_MESSAGE', 'INTERNAL_NOTE', 'SYSTEM_EVENT')),
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON public.support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_type ON public.support_ticket_messages(message_type);

-- 3. Row Level Security for support_ticket_messages
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students view public messages on their tickets" ON public.support_ticket_messages;
CREATE POLICY "Students view public messages on their tickets"
  ON public.support_ticket_messages
  FOR SELECT
  USING (
    message_type != 'INTERNAL_NOTE' AND
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE public.support_tickets.id = support_ticket_messages.ticket_id
        AND public.support_tickets.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins manage all support ticket messages" ON public.support_ticket_messages;
CREATE POLICY "Admins manage all support ticket messages"
  ON public.support_ticket_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );
