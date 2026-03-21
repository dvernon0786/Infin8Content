-- ============================================================
-- RPC: reseed_sections
-- Ensures atomic re-seeding of article sections after planning
-- ============================================================

CREATE OR REPLACE FUNCTION reseed_sections(
  p_article_id UUID,
  p_sections   JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. DELETE existing sections for this article
  DELETE FROM article_sections WHERE article_id = p_article_id;

  -- 2. INSERT new sections from the planner output
  INSERT INTO article_sections (
    article_id,
    section_order,
    section_header,
    section_type,
    planner_output,
    status,
    created_at,
    updated_at
  )
  SELECT
    p_article_id,
    (s->>'section_order')::int,
    s->>'section_header',
    s->>'section_type',
    s->'planner_output',
    'pending',
    now(),
    now()
  FROM jsonb_array_elements(p_sections) AS s;
END;
$$;

-- Secure the function
REVOKE ALL ON FUNCTION reseed_sections(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reseed_sections(UUID, JSONB) TO service_role;
