# Schema Enhancements - Migration 002

**Date:** 2026-02-04  
**Migration:** `002_add_profile_content_and_resume_context.sql`

## Overview

Enhanced the database schema to better support the core workflow:

1. **Profiles now store full markdown content** - comprehensive professional history
2. **Resumes track their creation context** - which company/job they were tailored for
3. **Results properly reference entities** - using foreign keys instead of text fields

---

## Changes

### 1. Profile Content Field

**What:** Added `content` field to store full markdown profile (person.md equivalent)

**Why:** Users need a comprehensive, editable professional profile that AI can use to generate resumes

**Before:**

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**After:**

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  display_name TEXT NOT NULL,
  content TEXT DEFAULT '', -- Full markdown profile
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**API Changes:**

- `PUT /api/profile` now accepts optional `content` field
- `POST /api/profile/enrich` fully implemented with AI parsing

### 2. Resume Context Tracking

**What:** Added `company_id`, `job_id`, and `is_primary` fields to resumes

**Why:** Track which company/job a resume was tailored for, and mark default resumes

**Before:**

```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**After:**

```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID REFERENCES companies(id), -- Optional context
  job_id UUID REFERENCES jobs(id), -- Optional context
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE, -- Default resume flag
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**API Changes:**

- `POST /api/resumes` accepts optional `companyId`, `jobId`, `isPrimary`
- `PUT /api/resumes/:id` can update context and primary flag
- `POST /api/resumes/:id/tailor` automatically sets context when saving

### 3. Results Foreign Keys

**What:** Added `resume_id`, `company_id`, `job_id` foreign keys to results table

**Why:** Proper relational integrity, easier querying, automatic cleanup

**Before:**

```sql
CREATE TABLE results (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT CHECK (type IN ('review', 'build')),
  person_name TEXT, -- Text field
  company_name TEXT, -- Text field
  job_title TEXT, -- Text field
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP
);
```

**After:**

```sql
CREATE TABLE results (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('review', 'build')),
  person_name TEXT, -- Kept for historical display
  company_name TEXT, -- Kept for historical display
  job_title TEXT, -- Kept for historical display
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP
);
```

**Why Keep Text Fields?** Historical record preservation. If a company/job is deleted, we still want to show what it was called.

**API Changes:**

- Results now automatically link to source entities
- Metadata simplified to store only analysis-specific data
- Better querying: "Show all results for this resume" or "for this job"

---

## User Workflows Enabled

### 1. Profile Management

```typescript
// User creates profile
PUT /api/profile
{
  "display_name": "John Doe",
  "content": "# Professional Summary\n\n..."
}

// User enriches profile from uploaded resume
POST /api/profile/enrich
{
  "text": "John Doe\n123 Main St...", // Pasted resume text
  "mode": "merge" // or "replace"
}
```

### 2. Resume Generation with Context

```typescript
// Generate resume tailored to specific job
POST /api/resumes/:id/tailor
{
  "jobId": "uuid-here",
  "save": true
}

// System automatically creates resume with:
// - company_id: job.company_id
// - job_id: job.id
// - title: "John Doe Resume - Software Engineer"
// - is_primary: false
```

### 3. Context-Aware Queries

```sql
-- Find all resumes created for a specific company
SELECT * FROM resumes WHERE company_id = $1;

-- Find all resumes tailored for a specific job
SELECT * FROM resumes WHERE job_id = $1;

-- Get user's primary resume
SELECT * FROM resumes WHERE user_id = $1 AND is_primary = true;

-- Get all analyses for a specific job
SELECT * FROM results WHERE job_id = $1 ORDER BY created_at DESC;

-- Find which resume was used to apply to a job
SELECT r.* FROM resumes r
JOIN results res ON res.resume_id = r.id
WHERE res.job_id = $1 AND res.type = 'build';
```

---

## Data Model Philosophy

### Profile = Source of Truth

- Comprehensive markdown with full professional history
- Updated via direct editing or AI enrichment
- Used as source material for generating resumes

### Resume = Snapshot/Version

- Specific version generated for context (company/job)
- Tracks its creation context via foreign keys
- Can be updated independently
- One resume can be marked as "primary" (default)

### Results = Audit Trail

- Historical record of AI operations
- Links to entities via foreign keys
- Preserves text names for historical display
- Flexible metadata for analysis-specific data

---

## Migration Process

### Option 1: Fresh Start (Recommended for Development)

1. **Backup any test data** you want to keep
2. **Drop existing tables** via Supabase SQL Editor:
   ```sql
   DROP TABLE IF EXISTS results CASCADE;
   DROP TABLE IF EXISTS jobs CASCADE;
   DROP TABLE IF EXISTS companies CASCADE;
   DROP TABLE IF EXISTS resumes CASCADE;
   DROP TABLE IF EXISTS profiles CASCADE;
   ```
3. **Run** `backend/database/migrations/001_initial_schema.sql`

### Option 2: Incremental Migration

1. **Run** `backend/database/migrations/002_add_profile_content_and_resume_context.sql`
2. **Verify** new columns exist:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'profiles';
   ```

---

## Breaking Changes

### API Request/Response Additions

**NOT Breaking** - All new fields are optional. Existing API calls will continue to work.

**New Fields Available:**

- Profile: `content`
- Resume: `company_id`, `job_id`, `is_primary`
- Results: `resume_id`, `company_id`, `job_id`

**Frontend Updates Needed:**

1. Update TypeScript types to include new fields
2. Add UI for editing profile content
3. Show resume context (company/job badges)
4. Filter resumes by company/job
5. Display primary resume indicator

---

## Testing Checklist

- [ ] Run migration 002 successfully
- [ ] Verify columns added to profiles, resumes, results
- [ ] Test profile content CRUD via API
- [ ] Test profile enrichment with AI
- [ ] Create resume with company/job context
- [ ] Tailor resume and verify context is saved
- [ ] Verify results link to resume/company/job
- [ ] Test resume queries (by company, by job, primary)
- [ ] Verify cascading deletes work properly

---

## Next Steps

1. **Update Frontend Types** - Add new fields to TypeScript interfaces
2. **Build Profile Editor** - Markdown editor for profile.content
3. **Add Context UI** - Show which company/job a resume is for
4. **Resume Filtering** - Filter by company, job, or primary flag
5. **Smart Defaults** - Auto-set is_primary for first resume

---

## SQL Quick Reference

```sql
-- Add profile content
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';

-- Add resume context
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id);
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;

-- Add result foreign keys
ALTER TABLE results ADD COLUMN IF NOT EXISTS resume_id UUID REFERENCES resumes(id);
ALTER TABLE results ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE results ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id);

-- Check schema
\d+ profiles
\d+ resumes
\d+ results
```
