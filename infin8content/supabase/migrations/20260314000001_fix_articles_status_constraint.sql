-- Fix articles status constraint to include 'draft' and 'processing'
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_status_check;
ALTER TABLE articles ADD CONSTRAINT articles_status_check 
  CHECK (status IN ('draft', 'queued', 'generating', 'processing', 'completed', 'failed', 'cancelled'));
