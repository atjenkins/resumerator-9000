# Data Model Refactor Plan

> Separate first-class analyses from activity logging. Promote resume metadata to proper columns.
> This is a **breaking change** - existing `results` table will be dropped and replaced.

---

## Overview

### Current Problem

The `results` table serves two conflicting purposes:
1. Storage for AI analysis outputs (scores, feedback, structured data)
2. Activity history log (what happened, when)

Analysis data is JSON-stringified into a TEXT column, making it unsearchable and not queryable.
Resume generation metadata (source type, emphasized skills) is buried in JSONB.

### Target State

| Concern | Table | Purpose |
|---------|-------|---------|
| AI analysis outputs | `analyses` | First-class entity with structured, queryable columns |
| Resume provenance | `resumes` (new columns) | How a resume was created, from what source, edited since? |
| Activity trail | `activity_log` | Lightweight event log of all user actions |

---

## Phase 1: Database Migration

### 1A. Drop `results` table

```sql
DROP TABLE IF EXISTS results CASCADE;
```

No data migration - clean slate.

### 1B. Create `analyses` table

```sql
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

  -- Job-fit specific fields
  missing_keywords JSONB DEFAULT '[]',
  transferable_skills JSONB DEFAULT '[]',
  targeted_suggestions JSONB DEFAULT '[]',

  -- Performance tracking
  duration_ms INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_source_resume ON analyses(source_resume_id) WHERE source_resume_id IS NOT NULL;
CREATE INDEX idx_analyses_job ON analyses(job_id) WHERE job_id IS NOT NULL;
CREATE INDEX idx_analyses_score ON analyses(user_id, score);
CREATE INDEX idx_analyses_type ON analyses(user_id, analysis_type);
CREATE INDEX idx_analyses_created_at ON analyses(user_id, created_at DESC);

-- RLS
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON analyses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analyses"
  ON analyses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON analyses FOR DELETE USING (auth.uid() = user_id);
```

### 1C. Add provenance columns to `resumes`

```sql
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
```

Column breakdown:
- **`origin`**: How the resume was created - `'manual'` (blank create), `'uploaded'` (parsed from file), `'generated'` (AI tailored)
- **`source_type`**: What the generation was based on - `'resume'` or `'profile'` (NULL for manual/uploaded)
- **`source_resume_id`**: If generated from another resume, which one (NULL if from profile or not generated)
- **`is_edited`**: Has the user modified the content since generation? (Tracks if it's still "pristine" AI output)
- **`generation_summary`**: The AI's explanation of tailoring decisions
- **`emphasized_skills`**: JSONB array of skills the AI highlighted
- **`selected_experiences`**: JSONB array of experiences the AI selected
- **`generation_duration_ms`**: How long generation took

### 1D. Create `activity_log` table

```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- What happened
  action TEXT NOT NULL,         -- 'analyze', 'generate', 'upload', 'enrich', 'create', 'update', 'delete', 'parse'
  entity_type TEXT NOT NULL,    -- 'resume', 'profile', 'company', 'job', 'analysis'
  entity_id UUID,               -- ID of the entity acted upon (nullable for profile actions)

  -- Promoted fields (not buried in JSONB)
  duration_ms INTEGER,          -- How long the action took (especially AI ops)
  source_type TEXT,             -- 'resume' or 'profile' (for AI ops)
  related_job_id UUID,          -- Job context used (for AI ops)
  related_company_id UUID,      -- Company context used (for AI ops)

  -- Display helpers (denormalized for fast history rendering)
  display_title TEXT,           -- Human-readable: "Analyzed resume for Google SWE"
  
  -- Overflow
  details JSONB DEFAULT '{}',   -- Anything else that doesn't warrant its own column

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_action ON activity_log(user_id, action);
CREATE INDEX idx_activity_entity ON activity_log(user_id, entity_type, entity_id);
CREATE INDEX idx_activity_created_at ON activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_duration ON activity_log(user_id, duration_ms) WHERE duration_ms IS NOT NULL;

-- RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity"
  ON activity_log FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activity"
  ON activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**Key design decisions:**
- `duration_ms` is a first-class column, not buried in JSONB - can filter/sort by it
- `display_title` is denormalized so the History page doesn't need JOINs to render
- `action` is a free-text field (not enum) so we can add new actions without migrations
- No UPDATE or DELETE policies on activity_log - it's append-only (immutable audit trail)

### 1E. Full migration SQL file

Write this as `backend/database/migrations/004_analyses_and_activity_log.sql` containing all of the above.

### Files:
- `backend/database/migrations/004_analyses_and_activity_log.sql` **(new)**

---

## Phase 2: Backend - Analysis Service

### 2A. Create `activity.service.ts`

Create a lightweight helper at `backend/src/services/activity.service.ts`:

```typescript
async function logActivity(userId: string, data: {
  action: string;
  entityType: string;
  entityId?: string;
  durationMs?: number;
  sourceType?: string;
  relatedJobId?: string;
  relatedCompanyId?: string;
  displayTitle: string;
  details?: Record<string, any>;
}): Promise<void>
```

- Fire-and-forget (don't await in the request handler, or catch and ignore errors)
- Never block the main response
- Used across all route files

### 2B. Update `ai.routes.ts`

**`POST /api/ai/analyze`** changes:
- Instead of inserting into `results`, insert into `analyses` with structured columns:
  - `score`, `fit_rating`, `summary`, `strengths`, `improvements`, `categories`
  - `missing_keywords`, `transferable_skills`, `targeted_suggestions` (for job-fit)
  - `source_type`, `source_resume_id`, `company_id`, `job_id`, `analysis_type`, `duration_ms`
- Return the analysis ID as `analysisId` (not `savedResultId`)
- Call `logActivity()` with action `'analyze'`

**`POST /api/ai/generate`** changes:
- When creating the resume, populate the new columns:
  - `origin: 'generated'`
  - `source_type`, `source_resume_id`
  - `generation_summary`, `emphasized_skills`, `selected_experiences`, `generation_duration_ms`
- No longer insert into `results`
- Call `logActivity()` with action `'generate'`

### 2C. Update other routes to log activity

Add `logActivity()` calls to existing routes:

| Route file | Actions to log |
|------------|---------------|
| `resumes.routes.ts` | `create`, `update`, `delete`, `upload`, `parse` |
| `companies.routes.ts` | `create`, `update`, `delete`, `parse` |
| `jobs.routes.ts` | `create`, `update`, `delete`, `parse` |
| `profile.routes.ts` | `update`, `enrich` |

Each call sets appropriate `displayTitle`, e.g.:
- `"Created resume 'My Resume'"`
- `"Deleted company 'Google'"`
- `"Enriched profile from uploaded file"`
- `"Parsed job description for 'Senior SWE'"`

### 2D. Update `resumes.routes.ts`

- On `POST /` (create): set `origin: 'manual'`
- On `POST /upload`: set `origin: 'uploaded'`
- On `PUT /:id`: set `is_edited: true` if the resume has `origin: 'generated'` and `content` changed

### 2E. Create new analyses routes

Create `backend/src/routes/analyses.routes.ts` (replace the existing one that reads from `results`):

- `GET /api/analyses` - List analyses for current user
  - Query params: `?sourceType=resume|profile`, `?jobId=`, `?resumeId=`, `?analysisType=general|job-fit`, `?minScore=`, `?limit=`, `?offset=`
  - Order by `created_at DESC` by default
- `GET /api/analyses/:id` - Get single analysis
- `DELETE /api/analyses/:id` - Delete an analysis

### 2F. Create activity log routes

Create `backend/src/routes/activity.routes.ts`:

- `GET /api/activity` - List activity for current user
  - Query params: `?action=`, `?entityType=`, `?entityId=`, `?limit=`, `?offset=`
  - Order by `created_at DESC`
- No create/update/delete endpoints (backend-only writes)

### 2G. Register routes in `server.ts`

- Mount `app.use("/api/activity", activityRoutes)`
- Existing `/api/analyses` mount stays, just points to rewritten file

### Files:
- `backend/src/services/activity.service.ts` **(new)**
- `backend/src/routes/ai.routes.ts` (rewrite inserts)
- `backend/src/routes/analyses.routes.ts` (rewrite to read from `analyses` table)
- `backend/src/routes/activity.routes.ts` **(new)**
- `backend/src/routes/resumes.routes.ts` (add origin/is_edited, add activity logging)
- `backend/src/routes/companies.routes.ts` (add activity logging)
- `backend/src/routes/jobs.routes.ts` (add activity logging)
- `backend/src/routes/profile.routes.ts` (add activity logging)
- `backend/src/web/server.ts` (register activity routes)

---

## Phase 3: Frontend - API & Types

### 3A. Update `api.ts`

- Update `analyzeDocument()` return type to match new structured response
- Add `getAnalysis(id)` pointing to new analyses endpoint
- Update `getAnalyses()` to support new query params
- Add `getActivity()` for activity log endpoint
- Remove any references to old `results` patterns

### 3B. Add TypeScript interfaces

Either in `api.ts` or a shared types file, add:

```typescript
interface Analysis {
  id: string;
  source_type: 'resume' | 'profile';
  source_resume_id?: string;
  company_id?: string;
  job_id?: string;
  analysis_type: 'general' | 'job-fit';
  score: number;
  fit_rating?: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  categories: Array<{ name: string; score: number; feedback: string }>;
  missing_keywords?: string[];
  transferable_skills?: string[];
  targeted_suggestions?: string[];
  duration_ms?: number;
  created_at: string;
}

interface ActivityLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  duration_ms?: number;
  source_type?: string;
  display_title: string;
  details?: Record<string, any>;
  created_at: string;
}
```

### Files:
- `frontend/src/services/api.ts`

---

## Phase 4: Frontend - Pages

### 4A. Update `AnalyzePage.tsx`

- Update result handling to work with the new structured `Analysis` response
- Store the returned `analysisId` so user can navigate to the detail view
- Add a "View Analysis" link after completion that navigates to the analysis detail

### 4B. Create `AnalysisDetailPage.tsx` (new)

A dedicated page for viewing a single analysis:
- Full display of score, fit rating, summary
- All category scores with progress bars
- Strengths and improvements lists
- Job-fit specific sections (missing keywords, transferable skills, targeted suggestions)
- Metadata: when it was created, what was analyzed, duration
- Navigation links: back to Analyze, link to the source resume/profile, link to the job

### 4C. Update `HistoryPage.tsx`

Rewrite to read from `/api/activity` instead of `/api/analyses`:
- Display a timeline/feed of all user actions
- Filtering by action type (analyze, generate, upload, create, update, delete)
- Filtering by entity type (resume, profile, company, job, analysis)
- Show `display_title` as the main text
- Show `duration_ms` where available
- Clickable entries that navigate to the relevant entity

### 4D. Update `GeneratePage.tsx`

- Update result handling: no longer expects `savedResultId`, gets `tailoredResumeId` directly
- The generated resume now has provenance fields visible on its detail page

### 4E. Update `ResumeDetailPage.tsx`

Show resume provenance information:
- If `origin === 'generated'`: show "Generated from [profile/resume name] for [job title]"
- If `origin === 'uploaded'`: show "Uploaded"
- If `is_edited`: show "Edited since generation" indicator
- Display `generation_summary` if present
- Show `emphasized_skills` and `selected_experiences` as badges if present

### 4F. Update `App.tsx` routing

- Add route case for `"analysis-detail"` page

### Files:
- `frontend/src/pages/AnalyzePage.tsx` (update result handling)
- `frontend/src/pages/AnalysisDetailPage.tsx` **(new)**
- `frontend/src/pages/HistoryPage.tsx` (rewrite for activity log)
- `frontend/src/pages/GeneratePage.tsx` (update result handling)
- `frontend/src/pages/ResumeDetailPage.tsx` (show provenance)
- `frontend/src/App.tsx` (add analysis-detail route)

---

## Phase 5: Documentation

- [ ] Update `docs/architecture.md` with new schema (analyses, activity_log, resume columns)
- [ ] Update `docs/tech-stack.md` with new API endpoints
- [ ] Update `backend/database/README.md` with the new migration

### Files:
- `docs/architecture.md`
- `docs/tech-stack.md`
- `backend/database/README.md`

---

## Execution Summary

| Phase | Scope | New Files | Changed Files | Notes |
|-------|-------|-----------|---------------|-------|
| 1: Migration | Small | 1 | 0 | SQL only, run in Supabase |
| 2: Backend | Large | 2 | 7 | Activity service + route rewrites |
| 3: Frontend API | Small | 0 | 1 | API client updates |
| 4: Frontend Pages | Medium | 1 | 5 | New analysis detail page + updates |
| 5: Docs | Small | 0 | 3 | Documentation |

**Execute in order**: Phase 1 (run SQL) -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5

**Prerequisites**: User must run the Phase 1 SQL migration in Supabase before backend changes will work.

---

## Execution Summary

**Status:** ✅ All phases completed  
**Date:** 2026-02-11

### Phase Completion

- ✅ **Phase 1: Database Migration** - Created `004_analyses_and_activity_log.sql`
- ✅ **Phase 2: Backend Services & Routes** - All backend routes updated with activity logging
- ✅ **Phase 3: Frontend API Client** - Types and API calls updated
- ✅ **Phase 4: Frontend Pages** - All pages updated including new AnalysisDetailPage
- ✅ **Phase 5: Documentation** - All documentation updated

### Key Deliverables

1. **Database Migration File**: `backend/database/migrations/004_analyses_and_activity_log.sql`
   - Drops `results` table
   - Creates `analyses` table with structured columns
   - Creates `activity_log` table for audit trail
   - Adds provenance columns to `resumes` table

2. **New Backend Services**: `activity.service.ts` for centralized activity logging

3. **Updated Backend Routes**:
   - `ai.routes.ts` - Uses new tables, logs all operations
   - `analyses.routes.ts` - Reads from new `analyses` table
   - `activity.routes.ts` - NEW: Activity log endpoints
   - `resumes.routes.ts` - Provenance tracking, activity logging
   - `companies/jobs/profile.routes.ts` - Activity logging added

4. **New Frontend Pages**: `AnalysisDetailPage.tsx` for viewing saved analyses

5. **Updated Frontend Pages**:
   - `AnalyzePage.tsx` - Link to view saved analysis
   - `HistoryPage.tsx` - Complete rewrite using activity log
   - `ResumeDetailPage.tsx` - Displays provenance information
   - `App.tsx` - New analysis-detail route

6. **Updated Documentation**:
   - `backend/database/README.md` - Migration 004 documented
   - `docs/architecture.md` - Schema and structure updated
   - `docs/tech-stack.md` - Backend patterns and API endpoints updated

### Next Steps for User

⚠️ **CRITICAL**: Before starting the application, you MUST:

1. Run the migration SQL in Supabase Dashboard:
   - Open `backend/database/migrations/004_analyses_and_activity_log.sql`
   - Copy entire contents
   - Paste into Supabase SQL Editor
   - Execute (this will drop the `results` table!)

2. Restart backend server to load new routes

3. Clear frontend cache/refresh browser to load new types

### Breaking Changes

- ❌ **Old `results` table dropped** - all historical data lost
- ❌ **Old `/api/resumes/:id/analyze` endpoint removed**
- ❌ **Old `/api/resumes/:id/tailor` endpoint removed**
- ✅ **New unified `/api/ai/analyze` and `/api/ai/generate` endpoints**

All features have been migrated to the new schema. The refactor is complete and ready for testing.
