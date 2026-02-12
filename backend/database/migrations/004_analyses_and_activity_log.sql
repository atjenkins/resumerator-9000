-- ============================================================
-- Migration 004: Analyses and Activity Log
-- Created: 2026-02-11
-- Description: Separate first-class analyses from activity logging.
--              Add provenance tracking to resumes.
-- ============================================================

-- ============================================================
-- Step 1: Drop old results table
-- ============================================================

DROP TABLE IF EXISTS results CASCADE;

-- ============================================================
-- Step 2: Create analyses table
-- ============================================================
-- First-class entity for AI analysis outputs
-- Structured, queryable columns instead of JSON-in-TEXT

CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- What was analyzed
  source_type TEXT NOT NULL CHECK (source_type IN ('resume', 'profile')),
  source_resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,

  -- Context used
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,

  -- Analysis classification
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('general', 'job-fit')),

  -- Structured results (queryable columns)
  score INTEGER,
  fit_rating TEXT CHECK (fit_rating IN ('excellent', 'good', 'moderate', 'poor')),
  summary TEXT,
  strengths JSONB DEFAULT '[]',
  improvements JSONB DEFAULT '[]',
  categories JSONB DEFAULT '[]',

  -- Job-fit specific fields (NULL for general analyses)
  missing_keywords JSONB DEFAULT '[]',
  transferable_skills JSONB DEFAULT '[]',
  targeted_suggestions JSONB DEFAULT '[]',

  -- Performance tracking
  duration_ms INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analyses
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_source_resume ON analyses(source_resume_id) WHERE source_resume_id IS NOT NULL;
CREATE INDEX idx_analyses_job ON analyses(job_id) WHERE job_id IS NOT NULL;
CREATE INDEX idx_analyses_company ON analyses(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_analyses_score ON analyses(user_id, score);
CREATE INDEX idx_analyses_type ON analyses(user_id, analysis_type);
CREATE INDEX idx_analyses_created_at ON analyses(user_id, created_at DESC);

-- RLS for analyses
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON analyses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analyses"
  ON analyses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON analyses FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Step 3: Add provenance columns to resumes
-- ============================================================
-- Track how resumes were created and their generation lineage

ALTER TABLE resumes
  ADD COLUMN origin TEXT NOT NULL DEFAULT 'manual'
    CHECK (origin IN ('manual', 'uploaded', 'generated')),
  ADD COLUMN source_type TEXT
    CHECK (source_type IN ('resume', 'profile')),
  ADD COLUMN source_resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  ADD COLUMN is_edited BOOLEAN DEFAULT FALSE,
  ADD COLUMN generation_summary TEXT,
  ADD COLUMN emphasized_skills JSONB DEFAULT '[]',
  ADD COLUMN selected_experiences JSONB DEFAULT '[]',
  ADD COLUMN generation_duration_ms INTEGER;

-- Indexes for resume provenance
CREATE INDEX idx_resumes_origin ON resumes(user_id, origin);
CREATE INDEX idx_resumes_source_resume ON resumes(source_resume_id) WHERE source_resume_id IS NOT NULL;
CREATE INDEX idx_resumes_generated_unedited ON resumes(user_id) WHERE origin = 'generated' AND is_edited = FALSE;

-- ============================================================
-- Step 4: Create activity_log table
-- ============================================================
-- Append-only audit trail of all user actions

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- What happened
  action TEXT NOT NULL,         -- 'analyze', 'generate', 'upload', 'enrich', 'create', 'update', 'delete', 'parse'
  entity_type TEXT NOT NULL,    -- 'resume', 'profile', 'company', 'job', 'analysis'
  entity_id UUID,               -- ID of the entity acted upon (nullable for profile actions)

  -- Promoted fields (not buried in JSONB for better querying)
  duration_ms INTEGER,          -- How long the action took (especially AI ops)
  source_type TEXT,             -- 'resume' or 'profile' (for AI ops)
  related_job_id UUID,          -- Job context used (for AI ops)
  related_company_id UUID,      -- Company context used (for AI ops)

  -- Display helpers (denormalized for fast history rendering without JOINs)
  display_title TEXT NOT NULL,  -- Human-readable: "Analyzed resume for Google SWE"
  
  -- Overflow for any additional data
  details JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for activity_log
CREATE INDEX idx_activity_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_action ON activity_log(user_id, action);
CREATE INDEX idx_activity_entity ON activity_log(user_id, entity_type, entity_id);
CREATE INDEX idx_activity_created_at ON activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_duration ON activity_log(user_id, duration_ms) WHERE duration_ms IS NOT NULL;

-- RLS for activity_log (read-only for users, write-only for backend)
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity"
  ON activity_log FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activity"
  ON activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Migration Complete
-- ============================================================
-- Note: This is a breaking change. The old results table is dropped.
-- All historical analysis data will be lost.
