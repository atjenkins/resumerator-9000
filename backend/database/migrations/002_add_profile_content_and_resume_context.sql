-- ============================================================
-- Migration 002: Add Profile Content & Resume Context Tracking
-- Created: 2026-02-04
-- Description: 
--   1. Add content field to profiles (for full markdown profile)
--   2. Add company_id and job_id to resumes (track context)
--   3. Add is_primary flag to resumes
--   4. Update results to reference resume_id instead of text fields
-- ============================================================

-- ============================================================
-- Add profile content field
-- ============================================================

-- Add content column to profiles (if not exists)
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';

-- Update existing profiles to have empty content
UPDATE profiles 
  SET content = '' 
  WHERE content IS NULL;

-- ============================================================
-- Add context tracking to resumes
-- ============================================================

-- Add company_id reference (optional)
ALTER TABLE resumes 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Add job_id reference (optional)
ALTER TABLE resumes 
  ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;

-- Add is_primary flag for default resume
ALTER TABLE resumes 
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;

-- Add indexes for new foreign keys
CREATE INDEX IF NOT EXISTS idx_resumes_company_id 
  ON resumes(company_id) WHERE company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_resumes_job_id 
  ON resumes(job_id) WHERE job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_resumes_primary 
  ON resumes(user_id) WHERE is_primary = TRUE;

-- ============================================================
-- Update results table to reference resumes properly
-- ============================================================

-- Add resume_id reference if not exists
ALTER TABLE results 
  ADD COLUMN IF NOT EXISTS resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL;

-- Add company_id and job_id references for better querying
ALTER TABLE results 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

ALTER TABLE results 
  ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_results_resume_id 
  ON results(resume_id) WHERE resume_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_results_company_id 
  ON results(company_id) WHERE company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_results_job_id 
  ON results(job_id) WHERE job_id IS NOT NULL;

-- ============================================================
-- Comments for documentation
-- ============================================================

COMMENT ON COLUMN profiles.content IS 'Full markdown profile with comprehensive professional history';
COMMENT ON COLUMN resumes.company_id IS 'Optional: Company this resume was tailored for';
COMMENT ON COLUMN resumes.job_id IS 'Optional: Job this resume was tailored for';
COMMENT ON COLUMN resumes.is_primary IS 'Flag to mark the users default/primary resume';
COMMENT ON COLUMN results.resume_id IS 'Which resume was used for this analysis';
COMMENT ON COLUMN results.company_id IS 'Company context used in analysis';
COMMENT ON COLUMN results.job_id IS 'Job context used in analysis';
