-- Day 55: Disaster Recovery, Backup & Business Continuity Migration
-- Creates disaster_recovery_audits table with Admin RLS policies.

CREATE TABLE IF NOT EXISTS public.disaster_recovery_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_number TEXT NOT NULL UNIQUE, -- e.g. DRA-2026-000001
    status TEXT NOT NULL, -- 'HEALTHY' | 'WARNING' | 'CRITICAL'
    rto_status TEXT NOT NULL, -- 'READY' | 'AT_RISK' | 'NOT_READY'
    rpo_status TEXT NOT NULL, -- 'READY' | 'AT_RISK' | 'NOT_READY'
    migration_score_percent NUMERIC NOT NULL,
    financial_integrity_status TEXT NOT NULL, -- 'HEALTHY' | 'WARNING' | 'CRITICAL'
    findings JSONB DEFAULT '[]'::jsonb,
    audited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_dr_audits_number ON public.disaster_recovery_audits(audit_number);
CREATE INDEX IF NOT EXISTS idx_dr_audits_status ON public.disaster_recovery_audits(status);
CREATE INDEX IF NOT EXISTS idx_dr_audits_created_at ON public.disaster_recovery_audits(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.disaster_recovery_audits ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Super Admins can view disaster recovery audit logs
DROP POLICY IF EXISTS "Admins can view disaster recovery audit logs" ON public.disaster_recovery_audits;
CREATE POLICY "Admins can view disaster recovery audit logs"
    ON public.disaster_recovery_audits
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policy: Super Admins can insert disaster recovery audit logs
DROP POLICY IF EXISTS "Admins can insert disaster recovery audit logs" ON public.disaster_recovery_audits;
CREATE POLICY "Admins can insert disaster recovery audit logs"
    ON public.disaster_recovery_audits
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );
