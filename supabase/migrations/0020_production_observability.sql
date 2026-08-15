-- Day 54: Production Observability, Reliability & SLO Monitoring Migration
-- Creates system_health_events table with composite indexes and Admin RLS policies.

CREATE TABLE IF NOT EXISTS public.system_health_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL, -- 'STUDENT_API' | 'VENDOR_API' | 'SUPERADMIN_API' | 'PAYMENT_API' | 'WEBHOOK_API' | 'INTERNAL_CRON' | 'WORKFLOW_ENGINE' | 'SLA_ENGINE' | 'DATABASE'
    event_type TEXT NOT NULL, -- 'API_REQUEST' | 'API_ERROR' | 'DATABASE_QUERY' | 'DATABASE_ERROR' | 'CRON_EXECUTION' | 'WORKFLOW_EXECUTION' | 'WEBHOOK_PROCESSING' | 'HEALTH_CHECK' | 'SLO_BREACH'
    status TEXT NOT NULL, -- 'SUCCESS' | 'FAILED' | 'DEGRADED' | 'TIMEOUT'
    severity TEXT NOT NULL DEFAULT 'INFO', -- 'INFO' | 'WARNING' | 'CRITICAL'
    duration_ms INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance & Composite Indexes
CREATE INDEX IF NOT EXISTS idx_system_health_service ON public.system_health_events(service_name);
CREATE INDEX IF NOT EXISTS idx_system_health_event_type ON public.system_health_events(event_type);
CREATE INDEX IF NOT EXISTS idx_system_health_status ON public.system_health_events(status);
CREATE INDEX IF NOT EXISTS idx_system_health_severity ON public.system_health_events(severity);
CREATE INDEX IF NOT EXISTS idx_system_health_created_at ON public.system_health_events(created_at);
CREATE INDEX IF NOT EXISTS idx_system_health_service_created ON public.system_health_events(service_name, created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.system_health_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Super Admins can view system health events
DROP POLICY IF EXISTS "Admins can view system health events" ON public.system_health_events;
CREATE POLICY "Admins can view system health events"
    ON public.system_health_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );
