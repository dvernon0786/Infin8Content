-- Enable Row Level Security (RLS) and fix security issues
-- Story 1.11: Row Level Security (RLS) Policies Implementation (REVISED)

-- ============================================================================
-- Helper Functions (Security Definer) - Defined FIRST to be used in policies
-- ============================================================================

-- Function to get the current user's org_id safely (avoids recursion)
CREATE OR REPLACE FUNCTION public.get_auth_user_org_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT org_id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Function to get invitation by token (Secure access for acceptance flow)
-- Replaces the need for a public RLS policy on team_invitations
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(token_input text)
RETURNS SETOF public.team_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.team_invitations WHERE token = token_input;
END;
$$;

-- ============================================================================
-- Enable RLS on all public tables
-- ============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'team_invitations'
  ) THEN
    ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================================
-- RLS Policies for organizations table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
CREATE POLICY "Users can view their own organization"
ON public.organizations
FOR SELECT
USING (
  id = public.get_auth_user_org_id()
);

DROP POLICY IF EXISTS "Owners can update their own organization" ON public.organizations;
CREATE POLICY "Owners can update their own organization"
ON public.organizations
FOR UPDATE
USING (
  id = public.get_auth_user_org_id()
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role = 'owner'
  )
);

DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- RLS Policies for users table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own user record" ON public.users;
CREATE POLICY "Users can view their own user record"
ON public.users
FOR SELECT
USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view organization members" ON public.users;
CREATE POLICY "Users can view organization members"
ON public.users
FOR SELECT
USING (
  org_id = public.get_auth_user_org_id()
);

DROP POLICY IF EXISTS "Users can update their own user record" ON public.users;
CREATE POLICY "Users can update their own user record"
ON public.users
FOR UPDATE
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create user records" ON public.users;
CREATE POLICY "Authenticated users can create user records"
ON public.users
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owners can update organization members" ON public.users;
CREATE POLICY "Owners can update organization members"
ON public.users
FOR UPDATE
USING (
  org_id = public.get_auth_user_org_id()
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role = 'owner'
  )
);

-- ============================================================================
-- RLS Policies for otp_codes table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own OTP codes" ON public.otp_codes;
CREATE POLICY "Users can view their own OTP codes"
ON public.otp_codes
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert their own OTP codes" ON public.otp_codes;
CREATE POLICY "Users can insert their own OTP codes"
ON public.otp_codes
FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own OTP codes" ON public.otp_codes;
CREATE POLICY "Users can update their own OTP codes"
ON public.otp_codes
FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

-- ============================================================================
-- RLS Policies for stripe_webhook_events table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view organization webhook events" ON public.stripe_webhook_events;
CREATE POLICY "Users can view organization webhook events"
ON public.stripe_webhook_events
FOR SELECT
USING (
  organization_id = public.get_auth_user_org_id()
);

DROP POLICY IF EXISTS "Service role can insert webhook events" ON public.stripe_webhook_events;
CREATE POLICY "Service role can insert webhook events"
ON public.stripe_webhook_events
FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- Fix function search_path security issues (Legacy)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.otp_codes
    WHERE expires_at < NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'cleanup_expired_invitations'
  ) THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
      RETURNS INTEGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $func$
      DECLARE
        updated_count INTEGER;
      BEGIN
        UPDATE public.team_invitations
        SET status = ''expired'',
            updated_at = NOW()
        WHERE expires_at < NOW()
          AND status = ''pending'';
        
        RETURN updated_count;
      END;
      $func$;
    ';
  END IF;
END $$;

-- ============================================================================
-- RLS Policies for team_invitations table (if exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'team_invitations'
  ) THEN
    -- Policy: Users can view invitations for their organization
    DROP POLICY IF EXISTS "Users can view organization invitations" ON public.team_invitations;
    CREATE POLICY "Users can view organization invitations"
    ON public.team_invitations
    FOR SELECT
    USING (
      org_id = public.get_auth_user_org_id()
    );

    -- Policy: Owners can create invitations for their organization
    DROP POLICY IF EXISTS "Owners can create invitations" ON public.team_invitations;
    CREATE POLICY "Owners can create invitations"
    ON public.team_invitations
    FOR INSERT
    WITH CHECK (
      org_id = public.get_auth_user_org_id()
      AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() AND role = 'owner'
      )
    );

    -- Policy: Owners can update invitations for their organization
    DROP POLICY IF EXISTS "Owners can update invitations" ON public.team_invitations;
    CREATE POLICY "Owners can update invitations"
    ON public.team_invitations
    FOR UPDATE
    USING (
      org_id = public.get_auth_user_org_id()
      AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() AND role = 'owner'
      )
    );

    -- CRITICAL CHANGE: Removed "Anyone can view invitation by token" policy
    -- Access is now handled via secure RPC: get_invitation_by_token()
    DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.team_invitations;

  END IF;
END $$;
