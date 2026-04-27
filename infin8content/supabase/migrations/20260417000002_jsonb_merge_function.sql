-- Helper RPC used by news-poller to merge a JSONB patch into articles.article_type_config
-- without overwriting the entire column (fix for last_polled_at update safety).
CREATE OR REPLACE FUNCTION jsonb_merge_article_type_config(
  p_article_id UUID,
  p_patch      JSONB
) RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  UPDATE articles
  SET article_type_config = COALESCE(article_type_config, '{}'::jsonb) || p_patch
  WHERE id = p_article_id;
$$;
