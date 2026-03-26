-- ==============================================================
-- ApplyBoost — Migration: Fix Stats Permissions & Realtime
-- ==============================================================

-- 1. Otorgar permisos de ejecución sobre la función de incremento
GRANT EXECUTE ON FUNCTION increment_platform_stat(TEXT) TO anon, authenticated;

-- 2. Asegurar RLS en la tabla platform_stats
ALTER TABLE platform_stats ENABLE ROW LEVEL SECURITY;

-- 3. Crear política para permitir SELECT a todos (público)
-- Usamos DROP POLICY IF EXISTS por seguridad si se llegara a re-ejecutar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'platform_stats' AND policyname = 'Allow public select access'
    ) THEN
        CREATE POLICY "Allow public select access"
        ON platform_stats
        FOR SELECT
        TO public
        USING (true);
    END IF;
END
$$;

-- 4. Habilitar la publicación para Realtime
-- Intentamos añadir la tabla a la publicación existente de Supabase
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE platform_stats;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    -- Ya estaba añadida, no hacemos nada
    NULL;
END
$$;
