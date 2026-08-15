-- Day 49: Automated Operations, Workflow Engine & Scheduled Jobs Migration
-- Creates workflow_rules and workflow_executions tables with unique execution_key idempotency constraint and Admin RLS policies.

CREATE TABLE IF NOT EXISTS public.workflow_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    event_type TEXT NOT NULL,
    condition_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    action_type TEXT NOT NULL,
    action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    severity TEXT NOT NULL DEFAULT 'INFO',
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_rule_id UUID NOT NULL REFERENCES public.workflow_rules(id) ON DELETE CASCADE,
    execution_key TEXT NOT NULL,
    status TEXT NOT NULL, -- 'SUCCESS' | 'FAILED' | 'SKIPPED'
    triggered_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    result_summary JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_rule_execution_key UNIQUE (workflow_rule_id, execution_key)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_rules_event_type ON public.workflow_rules(event_type);
CREATE INDEX IF NOT EXISTS idx_workflow_rules_enabled ON public.workflow_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_rule_id ON public.workflow_executions(workflow_rule_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_key ON public.workflow_executions(execution_key);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.workflow_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Super Admins can view workflow rules
DROP POLICY IF EXISTS "Admins can view workflow rules" ON public.workflow_rules;
CREATE POLICY "Admins can view workflow rules"
    ON public.workflow_rules
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policy: Super Admins can insert/update workflow rules
DROP POLICY IF EXISTS "Admins can manage workflow rules" ON public.workflow_rules;
CREATE POLICY "Admins can manage workflow rules"
    ON public.workflow_rules
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

-- RLS Policy: Super Admins can view workflow executions
DROP POLICY IF EXISTS "Admins can view workflow executions" ON public.workflow_executions;
CREATE POLICY "Admins can view workflow executions"
    ON public.workflow_executions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );
