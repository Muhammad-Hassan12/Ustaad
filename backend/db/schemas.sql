-- This sets up the tables needed for the Ustaad Career OS pipeline.

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending',

  -- User inputs
  candidate_name TEXT,
  target_role TEXT,
  target_city TEXT,
  cv_text TEXT,

  -- Agent outputs
  profile_data JSONB,
  market_data JSONB,
  gap_data JSONB,
  roadmap_data JSONB,
  cv_rewrite_data JSONB,

  -- Pipeline tracking
  agents_completed TEXT[] DEFAULT '{}',
  current_agent TEXT,
  error_message TEXT
);

CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  questions JSONB,
  current_question_index INT DEFAULT 0,
  answers JSONB DEFAULT '[]',
  scores JSONB DEFAULT '[]',
  final_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quota tracker for server-default shared key usage monitoring
-- report remaining capacity across server restarts.
CREATE TABLE IF NOT EXISTS quota_tracker (
  id INT PRIMARY KEY DEFAULT 1,
  reset_date DATE DEFAULT CURRENT_DATE,
  request_count INT DEFAULT 0
);

-- Seed the quota_tracker with a single row (singleton pattern)
INSERT INTO quota_tracker (id, reset_date, request_count)
VALUES (1, CURRENT_DATE, 0)
ON CONFLICT (id) DO NOTHING;

-- Row Level Security Setup
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quota_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow all" ON interview_sessions FOR ALL USING (true);
CREATE POLICY "Allow all" ON quota_tracker FOR ALL USING (true);
