-- 1. Reset initial stats with 1 view for confirmation
DELETE FROM platform_stats WHERE id = 1;
INSERT INTO platform_stats (id, page_views, cvs_generated, cvs_downloaded) 
VALUES (1, 1, 0, 0);

-- 2. Ensure platform_stats is in supabase_realtime publication
-- This ensures the Home view gets real-time updates when stats change
BEGIN;
  -- Remove if exists to avoid duplication
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS platform_stats;
  -- Add explicitly
  ALTER PUBLICATION supabase_realtime ADD TABLE platform_stats;
COMMIT;
