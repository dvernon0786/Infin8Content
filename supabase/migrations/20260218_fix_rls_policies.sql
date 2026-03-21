-- Fix RLS Policy Security Warnings
-- Replace overly permissive policies with proper security constraints

-- Drop and recreate debug_events policy with proper restrictions
DROP POLICY IF EXISTS "Service role can manage debug events" ON public.debug_events;

CREATE POLICY "Service role can manage debug events" ON public.debug_events
FOR ALL
USING (
  ((current_setting('request.jwt.claims', true)::json ->> 'role') = 'service_role') OR
  (EXISTS (
    SELECT 1 FROM public.debug_sessions
    WHERE debug_sessions.session_id = debug_events.session_id
    AND debug_sessions.user_id = auth.uid()
  ))
)
WITH CHECK (
  ((current_setting('request.jwt.claims', true)::json ->> 'role') = 'service_role') OR
  (EXISTS (
    SELECT 1 FROM public.debug_sessions
    WHERE debug_sessions.session_id = debug_events.session_id
    AND debug_sessions.user_id = auth.uid()
  ))
);

-- Drop and recreate debug_sessions policy with proper restrictions
DROP POLICY IF EXISTS "Service role can manage debug sessions" ON public.debug_sessions;

CREATE POLICY "Service role can manage debug sessions" ON public.debug_sessions
FOR ALL
USING (
  ((current_setting('request.jwt.claims', true)::json ->> 'role') = 'service_role') OR
  (auth.uid() = user_id)
)
WITH CHECK (
  ((current_setting('request.jwt.claims', true)::json ->> 'role') = 'service_role') OR
  (auth.uid() = user_id)
);

-- Drop and recreate rate_limits policy with proper restrictions
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;

CREATE POLICY "Service role can manage rate limits" ON public.rate_limits
FOR ALL
USING ((current_setting('request.jwt.claims', true)::json ->> 'role') = 'service_role')
WITH CHECK ((current_setting('request.jwt.claims', true)::json ->> 'role') = 'service_role');

-- Drop and recreate topic_clusters policy with proper restrictions
DROP POLICY IF EXISTS "Service role can manage topic clusters" ON public.topic_clusters;

CREATE POLICY "Service role can manage topic clusters" ON public.topic_clusters
FOR ALL
USING ((current_setting('request.jwt.claims', true)::json ->> 'role') = 'service_role')
WITH CHECK ((current_setting('request.jwt.claims', true)::json ->> 'role') = 'service_role');

-- Drop and recreate workflow_transition_audit policy with proper restrictions
DROP POLICY IF EXISTS "Service role can insert workflow audit logs" ON public.workflow_transition_audit;

CREATE POLICY "Service role can insert workflow audit logs" ON public.workflow_transition_audit
FOR INSERT
WITH CHECK ((current_setting('request.jwt.claims', true)::json ->> 'role') = 'service_role');

-- Add SELECT policy for audit logs (read-only for authenticated users)
CREATE POLICY "Users can read own workflow audit logs" ON public.workflow_transition_audit
FOR SELECT
USING (auth.uid() = user_id);
