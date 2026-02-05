-- ============================================================
-- Migration 001: Initial Schema
-- Created: 2026-02-04
-- Description: Initial database schema with profiles, resumes, companies, jobs, results
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Profiles Table
-- ============================================================
-- Extends auth.users with application-specific data
-- One profile per user - stores the comprehensive markdown profile
-- This is the "person.md" equivalent - full professional history

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT NOT NULL,
  content TEXT DEFAULT '', -- Full markdown profile (comprehensive professional info)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Companies Table
-- ============================================================
-- Companies that users are tracking/targeting

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT DEFAULT '', -- Markdown: company research, culture notes, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_company_slug UNIQUE(user_id, slug)
);

-- ============================================================
-- Jobs Table
-- ============================================================
-- Job postings that users are tracking
-- Can be standalone OR linked to a company

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL = standalone job
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT DEFAULT '', -- Markdown: job description, requirements, notes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint: slug unique per company (if company exists)
CREATE UNIQUE INDEX unique_company_job_slug 
  ON jobs(company_id, slug) 
  WHERE company_id IS NOT NULL;

-- For standalone jobs, slug must be unique per user
CREATE UNIQUE INDEX unique_user_standalone_job_slug 
  ON jobs(user_id, slug) 
  WHERE company_id IS NULL;

-- ============================================================
-- Resumes Table
-- ============================================================
-- Specific resume versions (uploaded, generated, tailored)
-- Can be linked to the company/job they were created for

CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL, -- Optional: tailored for this company
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL, -- Optional: tailored for this job
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown format
  is_primary BOOLEAN DEFAULT FALSE, -- Flag for main/default resume
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Results Table
-- ============================================================
-- Historical analysis results (reviews and builds)

CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL, -- Which resume was analyzed
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL, -- Context used
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL, -- Context used
  type TEXT NOT NULL CHECK (type IN ('review', 'build')),
  content TEXT NOT NULL, -- JSON or markdown result
  metadata JSONB DEFAULT '{}', -- Flexible additional data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================

-- Profiles
CREATE INDEX idx_profiles_display_name ON profiles(display_name);

-- Resumes
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_created_at ON resumes(user_id, created_at DESC);
CREATE INDEX idx_resumes_company_id ON resumes(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_resumes_job_id ON resumes(job_id) WHERE job_id IS NOT NULL;
CREATE INDEX idx_resumes_primary ON resumes(user_id) WHERE is_primary = TRUE;

-- Companies
CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_companies_name ON companies(user_id, name);
CREATE INDEX idx_companies_slug ON companies(user_id, slug);

-- Jobs
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_company_id ON jobs(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_jobs_created_at ON jobs(user_id, created_at DESC);

-- Results
CREATE INDEX idx_results_user_id ON results(user_id);
CREATE INDEX idx_results_resume_id ON results(resume_id) WHERE resume_id IS NOT NULL;
CREATE INDEX idx_results_type ON results(user_id, type);
CREATE INDEX idx_results_created_at ON results(user_id, created_at DESC);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Resumes policies
CREATE POLICY "Users can view own resumes"
  ON resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own resumes"
  ON resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes"
  ON resumes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes"
  ON resumes FOR DELETE
  USING (auth.uid() = user_id);

-- Companies policies
CREATE POLICY "Users can view own companies"
  ON companies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own companies"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies"
  ON companies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies"
  ON companies FOR DELETE
  USING (auth.uid() = user_id);

-- Jobs policies
CREATE POLICY "Users can view own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
  ON jobs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs"
  ON jobs FOR DELETE
  USING (auth.uid() = user_id);

-- Results policies
CREATE POLICY "Users can view own results"
  ON results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own results"
  ON results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own results"
  ON results FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Triggers for auto-updating timestamps
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at 
  BEFORE UPDATE ON resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at 
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at 
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
