-- Day 52: Operational Incident Center, SLA Management & Escalation Migration
-- Creates operational_incidents and operational_incident_audit tables with human-readable incident numbers and Admin RLS policies.

CREATE TABLE IF NOT EXISTS public.operational_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_number TEXT NOT NULL UNIQUE, -- e.g. INC-2026-000001
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    source_type TEXT NOT NULL, -- 'WORKFLOW' | 'SYSTEM' | 'ORDER' | 'SLA' | 'PAYMENT' | 'RECONCILIATION'
    source_id TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'INFO', -- 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'ESCALATED' | 'RESOLVED' | 'CLOSED'
    category TEXT NOT NULL, -- 'ORDER' | 'VENDOR' | 'DELIVERY' | 'PAYMENT' | 'RECONCILIATION' | 'WEBHOOK' | 'SYSTEM' | 'WORKFLOW' | 'SLA' | 'SECURITY'
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    acknowledged_at TIMESTAMPTZ,
    escalated_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    due_at TIMESTAMPTZ NOT NULL,
    last_updated_at TIMESTAMPTZ DEFAULT now(),
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    dedupe_key TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS public.operational_incident_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.operational_incidents(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'CREATED' | 'ACKNOWLEDGED' | 'ASSIGNED' | 'ESCALATED' | 'STATUS_CHANGED' | 'RESOLVED' | 'CLOSED'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_operational_incidents_number ON public.operational_incidents(incident_number);
CREATE INDEX IF NOT EXISTS idx_operational_incidents_dedupe ON public.operational_incidents(dedupe_key);
CREATE INDEX IF NOT EXISTS idx_operational_incidents_status ON public.operational_incidents(status);
CREATE INDEX IF NOT EXISTS idx_operational_incidents_severity ON public.operational_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_operational_incidents_category ON public.operational_incidents(category);
CREATE INDEX IF NOT EXISTS idx_operational_incidents_due_at ON public.operational_incidents(due_at);
CREATE INDEX IF NOT EXISTS idx_operational_incident_audit_inc_id ON public.operational_incident_audit(incident_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.operational_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_incident_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Super Admins can view operational incidents
DROP POLICY IF EXISTS "Admins can view operational incidents" ON public.operational_incidents;
CREATE POLICY "Admins can view operational incidents"
    ON public.operational_incidents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policy: Super Admins can manage operational incidents
DROP POLICY IF EXISTS "Admins can manage operational incidents" ON public.operational_incidents;
CREATE POLICY "Admins can manage operational incidents"
    ON public.operational_incidents
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policy: Super Admins can view incident audit history
DROP POLICY IF EXISTS "Admins can view incident audit history" ON public.operational_incident_audit;
CREATE POLICY "Admins can view incident audit history"
    ON public.operational_incident_audit
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );
