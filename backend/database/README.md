# Database Migrations

This directory contains SQL migration files for the Resumerator 9000 database schema.

## Migration Principles

### 1. **Sequential Numbering**

Migrations are numbered sequentially: `001`, `002`, `003`, etc.

### 2. **One-Way Migrations**

Migrations should be **additive** and **forward-only**. Avoid:

- Dropping columns with data
- Renaming columns (add new, deprecate old)
- Breaking changes without data migration

### 3. **Idempotent When Possible**

Use `IF NOT EXISTS`, `IF EXISTS` to make migrations rerunnable.

### 4. **Include Rollback Info**

Each migration should document how to rollback if needed.

---

## Migration Files

### `001_initial_schema.sql`

**Created:** 2026-02-04  
**Description:** Initial database schema

**Creates:**

- `profiles` - User profiles with display name and content
- `companies` - Target companies user is tracking
- `jobs` - Job postings (can be standalone or linked to company)
- `resumes` - Resume versions with optional company/job context
- `results` - Historical analysis results
- All indexes and RLS policies

### `002_add_profile_content_and_resume_context.sql`

**Created:** 2026-02-04  
**Description:** Enhance profiles and resumes

**Changes:**

- Add `content` field to profiles (full markdown profile)
- Add `company_id` and `job_id` to resumes (track context)
- Add `is_primary` flag to resumes
- Add foreign key references to results table
- Add corresponding indexes

**Rollback:**

```sql
ALTER TABLE profiles DROP COLUMN IF EXISTS content;
ALTER TABLE resumes DROP COLUMN IF EXISTS company_id;
ALTER TABLE resumes DROP COLUMN IF EXISTS job_id;
ALTER TABLE resumes DROP COLUMN IF EXISTS is_primary;
ALTER TABLE results DROP COLUMN IF EXISTS resume_id;
ALTER TABLE results DROP COLUMN IF EXISTS company_id;
ALTER TABLE results DROP COLUMN IF EXISTS job_id;
```

### `003_add_updated_at_columns.sql`

**Created:** 2026-02-11  
**Description:** Add updated_at columns and triggers

**Changes:**

- Add `updated_at` columns to `profiles`, `companies`, `jobs`, `resumes`
- Add database triggers to automatically update `updated_at` on record modification
- All `updated_at` columns default to NOW()

**Rollback:**

```sql
ALTER TABLE profiles DROP COLUMN IF EXISTS updated_at;
ALTER TABLE companies DROP COLUMN IF EXISTS updated_at;
ALTER TABLE jobs DROP COLUMN IF EXISTS updated_at;
ALTER TABLE resumes DROP COLUMN IF EXISTS updated_at;
DROP TRIGGER IF EXISTS set_updated_at ON profiles;
DROP TRIGGER IF EXISTS set_updated_at ON companies;
DROP TRIGGER IF EXISTS set_updated_at ON jobs;
DROP TRIGGER IF EXISTS set_updated_at ON resumes;
DROP FUNCTION IF EXISTS update_updated_at_column();
```

### `004_analyses_and_activity_log.sql`

**Created:** 2026-02-11  
**Description:** Separate first-class analyses from activity logging. Add provenance tracking to resumes.

**⚠️ BREAKING CHANGE:** This migration drops the `results` table. All historical data will be lost.

**Changes:**

- **Drop:** `results` table (old analysis storage)
- **Create:** `analyses` table with structured, queryable columns for AI analysis results
  - Separate columns for `score`, `fit_rating`, `summary`, `strengths`, `improvements`, `categories`
  - Job-fit specific fields: `missing_keywords`, `transferable_skills`, `targeted_suggestions`
  - Performance tracking: `duration_ms`
  - Full RLS policies and optimized indexes
- **Create:** `activity_log` table for append-only audit trail of all user actions
  - Tracks: `action`, `entity_type`, `entity_id`, `duration_ms`, `display_title`
  - Promoted columns for fast querying (no JSONB digging)
  - Denormalized for fast rendering without JOINs
- **Alter:** `resumes` table to add provenance tracking columns
  - `origin`: 'manual' | 'uploaded' | 'generated'
  - `source_type`, `source_resume_id`: track generation lineage
  - `is_edited`: flag for post-generation edits
  - `generation_summary`, `emphasized_skills`, `selected_experiences`: generation metadata
  - `generation_duration_ms`: AI operation timing

**Rollback:**

```sql
-- Drop new tables
DROP TABLE IF EXISTS analyses CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;

-- Remove new resume columns
ALTER TABLE resumes
  DROP COLUMN IF EXISTS origin,
  DROP COLUMN IF EXISTS source_type,
  DROP COLUMN IF EXISTS source_resume_id,
  DROP COLUMN IF EXISTS is_edited,
  DROP COLUMN IF EXISTS generation_summary,
  DROP COLUMN IF EXISTS emphasized_skills,
  DROP COLUMN IF EXISTS selected_experiences,
  DROP COLUMN IF EXISTS generation_duration_ms;

-- Recreate old results table (data will be lost)
CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resume_id UUID,
  company_id UUID,
  job_id UUID,
  type TEXT NOT NULL CHECK (type IN ('review', 'build')),
  person_name TEXT,
  company_name TEXT,
  job_title TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## How to Apply Migrations

### Via Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy contents of migration file
4. Click **Run** (or Cmd/Ctrl + Enter)
5. Verify success in the output panel

### Via Supabase CLI (Future)

```bash
supabase db push
```

---

## Creating New Migrations

### Naming Convention

```
[number]_[descriptive_name].sql
```

Examples:

- `003_add_cover_letters_table.sql`
- `004_add_user_preferences.sql`
- `005_add_resume_templates.sql`

### Template

```sql
-- ============================================================
-- Migration [NUMBER]: [TITLE]
-- Created: [DATE]
-- Description: [What this migration does]
-- ============================================================

-- Your SQL here

-- ============================================================
-- Rollback Instructions
-- ============================================================
-- [SQL commands to undo this migration]
```

### Checklist Before Creating Migration

- [ ] Sequential number assigned
- [ ] Descriptive filename
- [ ] Includes creation date and description
- [ ] Uses `IF NOT EXISTS` / `IF EXISTS` where appropriate
- [ ] Includes comments for complex logic
- [ ] Documents rollback procedure
- [ ] Tested on local/staging before production

---

## Migration Workflow

### Development

1. Make schema changes locally via Supabase Dashboard
2. Test thoroughly
3. Extract SQL to migration file
4. Commit migration file to git
5. Document in this README

### Production

1. Create database backup
2. Review migration SQL
3. Apply migration via SQL Editor
4. Verify tables, indexes, policies
5. Test API endpoints
6. Monitor for errors
7. If issues: rollback and fix

---

## Best Practices

### ✅ DO

- Keep migrations small and focused
- Add indexes for foreign keys
- Include comments explaining "why"
- Test migrations on staging first
- Use transactions when possible
- Document breaking changes

### ❌ DON'T

- Don't modify old migration files
- Don't drop tables without data migration
- Don't skip migration numbers
- Don't make multiple unrelated changes in one migration
- Don't forget to update RLS policies
- Don't deploy without testing

---

## Current Schema Version

**Latest Migration:** `002_add_profile_content_and_resume_context.sql`  
**Schema Version:** 2.0  
**Last Updated:** 2026-02-04

---

## Useful Queries

### Check Migration Status

```sql
-- See all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- See all columns in a table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'resumes'
ORDER BY ordinal_position;

-- See all indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- See all RLS policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Common Operations

```sql
-- Count records per table
SELECT 'profiles' as table_name, COUNT(*) FROM profiles
UNION ALL
SELECT 'resumes', COUNT(*) FROM resumes
UNION ALL
SELECT 'companies', COUNT(*) FROM companies
UNION ALL
SELECT 'jobs', COUNT(*) FROM jobs
UNION ALL
SELECT 'results', COUNT(*) FROM results;

-- Find orphaned records
SELECT * FROM jobs WHERE company_id NOT IN (SELECT id FROM companies);
SELECT * FROM resumes WHERE user_id NOT IN (SELECT id FROM auth.users);
```

---

## TypeScript Type Generation

After running any migration, regenerate TypeScript types for full type safety:

```bash
cd backend
npm run db:types
```

This pulls your live Supabase schema and generates `src/types/database.ts`.

### What it does:

- Generates types for all tables, views, functions, and enums
- Provides `Row`, `Insert`, and `Update` types for each table
- Enables autocomplete and compile-time validation for all database operations

### Example:

```typescript
// Before (returns any):
const { data } = await supabase.from("resumes").select("*");

// After (returns Database['public']['Tables']['resumes']['Row'][] | null):
const { data } = await supabase.from("resumes").select("*");
// TypeScript knows all columns: id, title, content, origin, etc.
```

### When to regenerate:

- After running a migration
- After adding/removing/renaming tables or columns
- After changing column types or constraints

**Note**: `src/types/database.ts` is gitignored. Each developer regenerates it locally after pulling schema changes.

---

## Future Migration Ideas

- Add tags/categories for resumes
- Add resume templates
- Add user preferences/settings
- Add collaboration/sharing features
- Add cover letter generation
- Add interview prep notes
- Add application tracking
