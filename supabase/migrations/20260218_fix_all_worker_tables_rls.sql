-- Apply service role fix to all worker-updated tables
-- Replace broken pg_has_role() with auth.role() checks

-- Keywords table (used by multiple workers)
DROP POLICY IF EXISTS "Service role full access" ON public.keywords;
CREATE POLICY "Service role full access"
ON public.keywords
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Topic clusters table (Step 6 worker)
DROP POLICY IF EXISTS "Service role can manage topic clusters" ON public.topic_clusters;
CREATE POLICY "Service role can manage topic clusters"
ON public.topic_clusters
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Articles table (Step 9 worker)
DROP POLICY IF EXISTS "Service role can manage articles" ON public.articles;
CREATE POLICY "Service role can manage articles"
ON public.articles
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Workflow transition audit table
DROP POLICY IF EXISTS "Service role can insert workflow audit logs" ON public.workflow_transition_audit;
CREATE POLICY "Service role can insert workflow audit logs"
ON public.workflow_transition_audit
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Intent audit logs table
DROP POLICY IF EXISTS "Service role can manage intent audit logs" ON public.intent_audit_logs;
CREATE POLICY "Service role can manage intent audit logs"
ON public.intent_audit_logs
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
