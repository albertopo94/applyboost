-- ==============================================================
-- ApplyBoost — MVP Module 1: CV & Cover Letter
-- Initial schema migration
-- Source of truth: ERD-applyboost.md + SDD-applyboost.md §10
-- ==============================================================

-- UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: users
-- Complements auth.users with business data.
-- Created automatically via trigger on_auth_user_created.
-- ============================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT,
  exports_available INTEGER NOT NULL DEFAULT 1
    CONSTRAINT users_exports_non_negative CHECK (exports_available >= 0),
  subscription_active BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_expires_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);

-- ============================================================
-- TABLE: user_exports
-- Authoritative source of truth for export availability.
-- canExport() reads ONLY from this table (ERD §5, SDD §7.7).
-- ============================================================
CREATE TABLE user_exports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  exports_available INTEGER NOT NULL DEFAULT 0
    CONSTRAINT user_exports_non_negative CHECK (exports_available >= 0),
  subscription_active BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_expires_at TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: generations
-- One row per generation request. Stores inputs + metadata.
-- ============================================================
CREATE TABLE generations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cv_text         TEXT NOT NULL,
  job_description TEXT NOT NULL,
  job_url         TEXT,
  output_language CHAR(2) NOT NULL
    CONSTRAINT generations_lang_check CHECK (output_language IN ('es', 'en', 'it')),
  tone            TEXT,
  focus           TEXT,
  generate_cv     BOOLEAN NOT NULL DEFAULT TRUE,
  generate_cover  BOOLEAN NOT NULL DEFAULT TRUE,
  interview_result TEXT DEFAULT 'pending'
    CONSTRAINT generations_interview_check CHECK (interview_result IN ('yes', 'no', 'pending')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_generations_user_id    ON generations (user_id);
CREATE INDEX idx_generations_created_at ON generations (created_at DESC);

-- ============================================================
-- TABLE: cv_versions
-- Stores LLM output for each generation (1:1).
-- ============================================================
CREATE TABLE cv_versions (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id            UUID NOT NULL UNIQUE REFERENCES generations(id) ON DELETE CASCADE,
  cv_optimizado            TEXT NOT NULL,
  cover_letter             TEXT,
  cover_letter_explanation TEXT,
  diff                     JSONB NOT NULL,
  keywords                 TEXT[] NOT NULL,
  score_original           INTEGER NOT NULL
    CONSTRAINT cv_versions_score_orig_check CHECK (score_original BETWEEN 0 AND 100),
  score_optimizado         INTEGER NOT NULL
    CONSTRAINT cv_versions_score_opt_check CHECK (score_optimizado BETWEEN 0 AND 100),
  falta_dato_fields        TEXT[],
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cv_versions_score ON cv_versions (score_optimizado);

-- ============================================================
-- TABLE: generation_logs
-- Usage behavior log per generation (moat de datos). 1:1.
-- ============================================================
CREATE TABLE generation_logs (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id           UUID NOT NULL UNIQUE REFERENCES generations(id) ON DELETE CASCADE,
  falta_dato_fields       TEXT[],
  falta_dato_filled       TEXT[],
  manual_edits            BOOLEAN NOT NULL DEFAULT FALSE,
  regenerations           INTEGER NOT NULL DEFAULT 0
    CONSTRAINT gen_logs_regen_check CHECK (regenerations >= 0),
  time_in_preview_seconds INTEGER,
  export_format           TEXT
    CONSTRAINT gen_logs_format_check CHECK (export_format IN ('pdf', 'doc', 'text', 'none')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_generation_logs_export_format ON generation_logs (export_format);
CREATE INDEX idx_generation_logs_manual_edits  ON generation_logs (manual_edits);

-- ============================================================
-- TABLE: stripe_events
-- Idempotency table for Stripe webhooks.
-- ============================================================
CREATE TABLE stripe_events (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_intent_id  TEXT NOT NULL UNIQUE,
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier               TEXT NOT NULL
    CONSTRAINT stripe_events_tier_check CHECK (tier IN ('10_exports', 'monthly_unlimited')),
  processed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stripe_events_user_id ON stripe_events (user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Every user only accesses their own data (SDD §9.2).
-- ============================================================
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_versions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exports    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_data"       ON users           FOR ALL USING (auth.uid() = id);
CREATE POLICY "generations_own_data" ON generations     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "exports_own_data"     ON user_exports    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "cv_versions_own_data" ON cv_versions FOR ALL USING (
  auth.uid() = (SELECT user_id FROM generations WHERE id = generation_id)
);

CREATE POLICY "logs_own_data" ON generation_logs FOR ALL USING (
  auth.uid() = (SELECT user_id FROM generations WHERE id = generation_id)
);

-- ============================================================
-- TRIGGER: Auto-create users + user_exports on auth signup
-- Gives 1 free export on registration (SDD §7.6).
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name, exports_available)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 1);

  INSERT INTO user_exports (user_id, exports_available)
  VALUES (NEW.id, 1);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
