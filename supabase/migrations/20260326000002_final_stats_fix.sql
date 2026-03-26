-- 1. Grant usage on schema public to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Grant execute permissions on the increment_platform_stat function
GRANT EXECUTE ON FUNCTION increment_platform_stat(TEXT) TO anon, authenticated;

-- 3. Ensure platform_stats is in the supabase_realtime publication
-- We use a DO block to check if it's already added to avoid errors
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'platform_stats'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE platform_stats;
        END IF;
    END IF;
END $$;

-- 4. Initial manual increment to verify the fix
SELECT increment_platform_stat('page_views');
