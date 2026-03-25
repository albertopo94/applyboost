-- ==============================================================
-- ApplyBoost — Migration: platform_stats & telemetry
-- ==============================================================

CREATE TABLE IF NOT EXISTS platform_stats (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  page_views BIGINT NOT NULL DEFAULT 0,
  cvs_generated BIGINT NOT NULL DEFAULT 0,
  cvs_downloaded BIGINT NOT NULL DEFAULT 0
);

INSERT INTO platform_stats (id, page_views, cvs_generated, cvs_downloaded) 
VALUES (1, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION increment_platform_stat(stat_name TEXT)
RETURNS void AS $$
BEGIN
  IF stat_name = 'page_views' THEN
    UPDATE platform_stats SET page_views = page_views + 1 WHERE id = 1;
  ELSIF stat_name = 'cvs_generated' THEN
    UPDATE platform_stats SET cvs_generated = cvs_generated + 1 WHERE id = 1;
  ELSIF stat_name = 'cvs_downloaded' THEN
    UPDATE platform_stats SET cvs_downloaded = cvs_downloaded + 1 WHERE id = 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exponer solo lectura pública (para que el Frontend lo lea sin Auth)
GRANT SELECT ON platform_stats TO anon, authenticated;
