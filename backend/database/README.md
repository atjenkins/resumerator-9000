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

## Future Migration Ideas

- Add tags/categories for resumes
- Add resume templates
- Add user preferences/settings
- Add collaboration/sharing features
- Add cover letter generation
- Add interview prep notes
- Add application tracking
