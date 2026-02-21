-- Create system user for audit logging
-- This satisfies the FK constraint while maintaining audit integrity
-- Note: Using 'admin' role as it's a valid role that exists in the users_role_check constraint

INSERT INTO public.users (id, email, role)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'system@internal.local',
  'admin'
) ON CONFLICT (id) DO NOTHING;
