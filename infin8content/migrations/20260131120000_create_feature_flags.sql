-- Create feature_flags table for organization-level feature flag management
-- Story 33-4: Enable Intent Engine Feature Flag
-- Task 1: Create feature_flags database table

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  flag_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  
  -- Ensure each organization can only have one entry per flag
  UNIQUE(organization_id, flag_key)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feature_flags_organization_id ON feature_flags(organization_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_flag_key ON feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_organization_flag ON feature_flags(organization_id, flag_key);

-- Enable Row Level Security
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feature_flags
CREATE POLICY "Users can view feature flags for their organization" ON feature_flags
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM users 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admin users can insert feature flags for their organization" ON feature_flags
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT org_id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admin users can update feature flags for their organization" ON feature_flags
  FOR UPDATE USING (
    organization_id IN (
      SELECT org_id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admin users can delete feature flags for their organization" ON feature_flags
  FOR DELETE USING (
    organization_id IN (
      SELECT org_id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_feature_flags_updated_at_trigger 
  BEFORE UPDATE ON feature_flags 
  FOR EACH ROW 
  EXECUTE FUNCTION update_feature_flags_updated_at();

-- Function to log feature flag changes for audit trail
CREATE OR REPLACE FUNCTION log_feature_flag_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the change in audit_logs table if it exists
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      organization_id,
      user_id,
      action,
      details,
      ip_address,
      user_agent,
      created_at
    ) VALUES (
      NEW.organization_id,
      NEW.updated_by,
      'FEATURE_FLAG_TOGGLED',
      jsonb_build_object(
        'flag_key', NEW.flag_key,
        'enabled', NEW.enabled,
        'operation', TG_OP
      ),
      inet_client_addr(),
      current_setting('request.headers')::text,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to log feature flag changes
CREATE TRIGGER log_feature_flag_changes_trigger 
  AFTER INSERT OR UPDATE ON feature_flags 
  FOR EACH ROW 
  EXECUTE FUNCTION log_feature_flag_change();
