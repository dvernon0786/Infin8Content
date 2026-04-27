-- Story 13-1: Deduplication table for news poller.
-- Prevents the same story from being processed more than once per watch.

CREATE TABLE IF NOT EXISTS news_processed_stories (
  id                    BIGSERIAL    PRIMARY KEY,
  org_id                UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  watch_topic           TEXT         NOT NULL,
  source                TEXT         NOT NULL CHECK (source IN ('hackernews', 'google_news')),
  source_id             TEXT         NOT NULL,
  source_url            TEXT         NOT NULL,
  source_title          TEXT,
  generated_article_id  UUID         REFERENCES articles(id) ON DELETE SET NULL,
  processed_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Unique per org + topic + source + story — prevents duplicate processing
CREATE UNIQUE INDEX IF NOT EXISTS uidx_news_processed
  ON news_processed_stories (org_id, watch_topic, source, source_id);

-- Fast lookup during poll runs
CREATE INDEX IF NOT EXISTS idx_news_processed_org_source
  ON news_processed_stories (org_id, source, processed_at DESC);
