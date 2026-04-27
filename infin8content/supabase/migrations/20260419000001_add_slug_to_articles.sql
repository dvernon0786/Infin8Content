-- Bug fix: column articles.slug does not exist
-- The slug column was referenced in queries (Epic 13 / article detail page, publish-to-social,
-- caption route, internal-linking service) but was never added to the articles table.
-- This migration adds the column safely with no downtime risk.

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS slug TEXT DEFAULT NULL;

-- Unique constraint: once set, slugs must be unique per org or across the table.
-- Using a partial index so that NULL values (not-yet-slugged articles) are excluded.
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_slug_unique
  ON articles (slug)
  WHERE slug IS NOT NULL;

-- General lookup index for slug-based routing.
CREATE INDEX IF NOT EXISTS idx_articles_slug
  ON articles (slug);

-- Verify:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'articles' AND column_name = 'slug';
