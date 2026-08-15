-- Day 53: Automated Incident SLA Escalation & On-Call Operations Migration
-- Creates operational_incident_escalations table with (incident_id, level) uniqueness constraint and Admin RLS policies.

CREATE TABLE IF NOT EXISTS public.operational_incident_escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.operational_incidents(id) ON DELETE CASCADE,
    level INTEGER NOT NULL, -- 0: CREATED, 1: AT_RISK, 2: BREACHED, 3: CRITICAL_ESCALATION
    reason TEXT NOT NULL,
    triggered_at TIMESTAMPTZ DEFAULT now(),
    triggered_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    notification_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_incident_escalation_level UNIQUE (incident_id, level)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_incident_escalations_inc_id ON public.operational_incident_escalations(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_escalations_level ON public.operational_incident_escalations(level);
CREATE INDEX IF NOT EXISTS idx_incident_escalations_triggered_at ON public.operational_incident_escalations(triggered_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.operational_incident_escalations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Super Admins can view incident escalations
DROP POLICY IF EXISTS "Admins can view incident escalations" ON public.operational_incident_escalations;
CREATE POLICY "Admins can view incident escalations"
    ON public.operational_incident_escalations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policy: Super Admins can manage incident escalations
DROP POLICY IF EXISTS "Admins can manage incident escalations" ON public.operational_incident_escalations;
CREATE POLICY "Admins can manage incident escalations"
    ON public.operational_incident_escalations
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
