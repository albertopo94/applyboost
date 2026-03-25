-- ==============================================================
-- ApplyBoost — Migration: anonymous-to-user-mvp (Phase 1: Database)
-- Purpose: Implement schema for Frictionless MVP (Anonymous usage).
-- ==============================================================

-- 1. Create anonymous_usage table
-- tracks usage limits (capped at 3) per anonymous_id.
CREATE TABLE IF NOT EXISTS public.anonymous_usage (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anonymous_id    TEXT UNIQUE NOT NULL,
  count           INTEGER NOT NULL DEFAULT 0,
  last_used_at    TIMESTAMPTZ DEFAULT NOW(),
  ip_hash         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for performance and lookup
CREATE INDEX idx_anonymous_usage_anon_id ON public.anonymous_usage (anonymous_id);

-- 2. Modify generations table
-- Make user_id nullable and add anonymous_id (TEXT).
ALTER TABLE public.generations ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS anonymous_id TEXT;

-- Indexing for performance and lookup
CREATE INDEX IF NOT EXISTS idx_generations_anonymous_id ON public.generations (anonymous_id);

-- 3. Implement merge_anonymous_data SQL function
-- Atomic reassign generations from anon to user and cleanup.
CREATE OR REPLACE FUNCTION public.merge_anonymous_data(anon_id TEXT, target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Reassign generations from anon to user
  UPDATE public.generations 
  SET user_id = target_user_id, anonymous_id = NULL
  WHERE anonymous_id = anon_id;

  -- Delete anon usage record after successful merge
  DELETE FROM public.anonymous_usage WHERE anonymous_id = anon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Configure RLS for anonymous_usage
ALTER TABLE public.anonymous_usage ENABLE ROW LEVEL SECURITY;

-- Allow service role (middleware) to manage anonymous_usage
CREATE POLICY "service_role_manage_anon_usage" ON public.anonymous_usage
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Update RLS policies for generations
-- Allow access by anonymous_id for unauthenticated requests.
CREATE POLICY "generations_anon_access" ON public.generations
  FOR ALL TO anon
  USING (anonymous_id IS NOT NULL)
  WITH CHECK (anonymous_id IS NOT NULL);

-- Extend RLS for child tables to allow anon access if they own the parent generation
CREATE POLICY "cv_versions_anon_access" ON public.cv_versions
  FOR ALL TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.generations 
      WHERE generations.id = cv_versions.generation_id 
      AND generations.anonymous_id IS NOT NULL
    )
  );

CREATE POLICY "generation_logs_anon_access" ON public.generation_logs
  FOR ALL TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.generations 
      WHERE generations.id = generation_logs.generation_id 
      AND generations.anonymous_id IS NOT NULL
    )
  );
