-- ============================================================
-- RPC: reseed_sections
-- Ensures atomic re-seeding of article sections after planning
-- ============================================================

CREATE OR REPLACE FUNCTION reseed_sections(
  p_article_id UUID,
  p_sections JSONB
) RETURNS VOID AS $$
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
    (elem.value->>'section_order')::INT,
    (elem.value->>'section_header'),
    (elem.value->>'section_type'),
    (elem.value->'planner_output')::JSONB,
    'pending',
    now(),
    now()
  FROM jsonb_array_elements(p_sections) AS elem;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
