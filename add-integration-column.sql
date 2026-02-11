-- Add integration column to organizations table
ALTER TABLE organizations 
ADD COLUMN integration JSONB NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND column_name = 'integration';
