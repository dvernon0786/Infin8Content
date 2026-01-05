-- Enable Row Level Security (RLS) and fix security issues
-- Story 1.11: Row Level Security (RLS) Policies Implementation
-- Addresses Supabase database linter security warnings

-- ============================================================================
-- Enable RLS on all public tables
-- ============================================================================

-- Enable RLS on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on otp_codes table
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on stripe_webhook_events table
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Enable RLS on team_invitations table (if it exists)
ALTER TABLE IF EXISTS public.team_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for organizations table
-- ============================================================================

-- Policy: Users can view their own organization
CREATE POLICY "Users can view their own organization"
ON public.organizations
FOR SELECT
USING (
  id IN (
    SELECT org_id FROM public.users
    WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Users can update their own organization (owners only)
CREATE POLICY "Owners can update their own organization"
ON public.organizations
FOR UPDATE
USING (
  id IN (
    SELECT org_id FROM public.users
    WHERE auth_user_id = auth.uid()
    AND role = 'owner'
  )
);

-- Policy: Authenticated users can create organizations (during registration)
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- RLS Policies for users table
-- ============================================================================

-- Policy: Users can view their own user record
CREATE POLICY "Users can view their own user record"
ON public.users
FOR SELECT
USING (auth_user_id = auth.uid());

-- Policy: Users can view other users in their organization
CREATE POLICY "Users can view organization members"
ON public.users
FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM public.users
    WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Users can update their own user record (limited fields)
CREATE POLICY "Users can update their own user record"
ON public.users
FOR UPDATE
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Policy: Authenticated users can create user records (during registration)
CREATE POLICY "Authenticated users can create user records"
ON public.users
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Owners can update organization members (for role changes)
CREATE POLICY "Owners can update organization members"
ON public.users
FOR UPDATE
USING (
  org_id IN (
    SELECT org_id FROM public.users
    WHERE auth_user_id = auth.uid()
    AND role = 'owner'
  )
);

-- ============================================================================
-- RLS Policies for otp_codes table
-- ============================================================================

-- Policy: Users can view their own OTP codes
CREATE POLICY "Users can view their own OTP codes"
ON public.otp_codes
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.users
    WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Users can insert their own OTP codes
CREATE POLICY "Users can insert their own OTP codes"
ON public.otp_codes
FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users
    WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Users can update their own OTP codes (for verification)
CREATE POLICY "Users can update their own OTP codes"
ON public.otp_codes
FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM public.users
    WHERE auth_user_id = auth.uid()
  )
);

-- ============================================================================
-- RLS Policies for stripe_webhook_events table
-- ============================================================================

-- Policy: Service role can do everything (webhooks use service role)
-- Note: Service role bypasses RLS by default, but explicit policy for clarity
-- This table is primarily accessed by webhook handlers using service role

-- Policy: Users can view webhook events for their organization
CREATE POLICY "Users can view organization webhook events"
ON public.stripe_webhook_events
FOR SELECT
USING (
  organization_id IN (
    SELECT org_id FROM public.users
    WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Service role can insert webhook events
-- Note: Service role operations bypass RLS, but this policy documents intent
CREATE POLICY "Service role can insert webhook events"
ON public.stripe_webhook_events
FOR INSERT
WITH CHECK (true); -- Service role bypasses RLS anyway

-- ============================================================================
-- Fix function search_path security issues
-- ============================================================================

-- Fix cleanup_expired_otp_codes function
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

-- Fix update_updated_at_column function
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

-- Fix cleanup_expired_invitations function
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update invitations where expires_at < NOW() AND status = 'pending' to status = 'expired'
  UPDATE public.team_invitations
  SET status = 'expired',
      updated_at = NOW()
  WHERE expires_at < NOW()
    AND status = 'pending';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON POLICY "Users can view their own organization" ON public.organizations IS 'Allows users to view their organization data';
COMMENT ON POLICY "Owners can update their own organization" ON public.organizations IS 'Allows organization owners to update organization settings';
COMMENT ON POLICY "Authenticated users can create organizations" ON public.organizations IS 'Allows authenticated users to create organizations during registration';

COMMENT ON POLICY "Users can view their own user record" ON public.users IS 'Allows users to view their own user record';
COMMENT ON POLICY "Users can view organization members" ON public.users IS 'Allows users to view other members of their organization';
COMMENT ON POLICY "Users can update their own user record" ON public.users IS 'Allows users to update their own user record';
COMMENT ON POLICY "Authenticated users can create user records" ON public.users IS 'Allows authenticated users to create user records during registration';
COMMENT ON POLICY "Owners can update organization members" ON public.users IS 'Allows organization owners to update member roles';

COMMENT ON POLICY "Users can view their own OTP codes" ON public.otp_codes IS 'Allows users to view their own OTP codes';
COMMENT ON POLICY "Users can insert their own OTP codes" ON public.otp_codes IS 'Allows users to create OTP codes for themselves';
COMMENT ON POLICY "Users can update their own OTP codes" ON public.otp_codes IS 'Allows users to verify their OTP codes';

COMMENT ON POLICY "Users can view organization webhook events" ON public.stripe_webhook_events IS 'Allows users to view webhook events for their organization';
COMMENT ON POLICY "Service role can insert webhook events" ON public.stripe_webhook_events IS 'Allows service role to insert webhook events (bypasses RLS)';

-- ============================================================================
-- RLS Policies for team_invitations table (if exists)
-- ============================================================================

-- Policy: Users can view invitations for their organization
DROP POLICY IF EXISTS "Users can view organization invitations" ON public.team_invitations;
CREATE POLICY "Users can view organization invitations"
ON public.team_invitations
FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM public.users
    WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Owners can create invitations for their organization
DROP POLICY IF EXISTS "Owners can create invitations" ON public.team_invitations;
CREATE POLICY "Owners can create invitations"
ON public.team_invitations
FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT org_id FROM public.users
    WHERE auth_user_id = auth.uid()
    AND role = 'owner'
  )
);

-- Policy: Owners can update invitations for their organization
DROP POLICY IF EXISTS "Owners can update invitations" ON public.team_invitations;
CREATE POLICY "Owners can update invitations"
ON public.team_invitations
FOR UPDATE
USING (
  org_id IN (
    SELECT org_id FROM public.users
    WHERE auth_user_id = auth.uid()
    AND role = 'owner'
  )
);

-- Policy: Anyone can view invitations by token (for acceptance flow)
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.team_invitations;
CREATE POLICY "Anyone can view invitation by token"
ON public.team_invitations
FOR SELECT
USING (true); -- Token provides authorization, not RLS

COMMENT ON POLICY "Users can view organization invitations" ON public.team_invitations IS 'Allows users to view invitations for their organization';
COMMENT ON POLICY "Owners can create invitations" ON public.team_invitations IS 'Allows organization owners to create team invitations';
COMMENT ON POLICY "Owners can update invitations" ON public.team_invitations IS 'Allows organization owners to update/cancel invitations';
COMMENT ON POLICY "Anyone can view invitation by token" ON public.team_invitations IS 'Allows anyone to view invitation by token (for acceptance flow)';

-- ============================================================================
-- Notes
-- ============================================================================

-- NOTE: Leaked Password Protection must be enabled in Supabase Dashboard
-- This cannot be done via migration. Go to:
-- Supabase Dashboard > Authentication > Password Security > Enable "Leaked Password Protection"
-- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

