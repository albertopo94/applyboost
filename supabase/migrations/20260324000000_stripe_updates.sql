-- ==============================================================
-- Migration: stripe_updates
-- Purpose: Formalize Stripe event logging and atomic credit increments.
-- Date: 2026-03-24
-- ==============================================================

-- 1. Recreate stripe_events with the refined schema for audit and reconciliation.
DROP TABLE IF EXISTS stripe_events;

CREATE TABLE stripe_events (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  event_type        TEXT NOT NULL,
  user_id           UUID REFERENCES auth.users(id),
  amount_total      INTEGER,
  stripe_session_id TEXT,
  raw_event         JSONB
);

-- Indexing for performance and lookup
CREATE INDEX idx_stripe_events_user_id ON stripe_events (user_id);
CREATE INDEX idx_stripe_events_session_id ON stripe_events (stripe_session_id);

-- Enable RLS for stripe_events
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own event logs for transparency (if needed by UI)
CREATE POLICY "users_view_own_stripe_events" ON stripe_events FOR SELECT USING (auth.uid() = user_id);

-- 2. Implement RPC increment_user_credits
-- This ensures atomic updates to the exports_available balance.
-- According to initial_schema.sql, user_exports is the authoritative source.
CREATE OR REPLACE FUNCTION increment_user_credits(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Update the authoritative source: user_exports
  UPDATE user_exports
  SET exports_available = exports_available + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Sync the denormalized value in the users table
  UPDATE users
  SET exports_available = exports_available + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
