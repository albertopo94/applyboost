-- Verify if exists row with id=1 in platform_stats
INSERT INTO platform_stats (id, page_views, cvs_generated, cvs_downloaded)
SELECT 1, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM platform_stats WHERE id = 1);

-- Ensure search_path is public
ALTER FUNCTION increment_platform_stat(TEXT) SET search_path = public;
