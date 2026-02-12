# Architecture Documentation

## Overview

Resumerator 9000 is an AI-powered resume review and generation tool using a decoupled frontend and backend architecture.

## Architecture Decisions

### Application Architecture: Decoupled Frontend + Backend

**Frontend: Vite + React on Vercel**

- Static site deployment on Vercel
- Fast development with Vite
- Clean separation of concerns

**Backend: Express API on Railway**

- Traditional Node.js server with no timeout limits
- Handles long-running AI operations (>30s)
- RESTful API design

**Why not Next.js?**

- AI operations exceed serverless function timeout limits (10-60s)
- Dashboard app doesn't require SSR/SEO benefits
- Simpler architecture with clear separation

### Infrastructure

```
User Browser
    ↓
Vercel (Vite React Frontend)
    ↓ HTTPS REST API calls
Railway (Express Backend)
    ↓ Read/Write
Supabase (PostgreSQL + Auth)
    ↓ AI Calls
Anthropic Claude API
```

### Database: Supabase PostgreSQL

**Schema Design:**

```sql
-- Users (via Supabase Auth)
profiles
├── id (uuid, FK to auth.users)
├── display_name (text)
├── created_at (timestamp)
└── updated_at (timestamp)

-- Resume data (markdown stored as text)
resumes
├── id (uuid)
├── user_id (uuid, FK)
├── title (text)
├── content (text)  -- markdown
├── created_at (timestamp)
└── updated_at (timestamp)

companies
├── id (uuid)
├── user_id (uuid, FK)
├── name (text)
├── slug (text)     -- for URLs
├── content (text)  -- markdown
├── created_at (timestamp)
└── updated_at (timestamp)

jobs
├── id (uuid)
├── company_id (uuid, FK)
├── user_id (uuid, FK)
├── title (text)
├── slug (text)
├── content (text)  -- markdown
├── created_at (timestamp)
└── updated_at (timestamp)

resumes (provenance fields)
├── origin (enum: 'manual' | 'uploaded' | 'generated')
├── source_type (enum: 'resume' | 'profile')
├── source_resume_id (uuid, FK to resumes)
├── is_edited (boolean)
├── generation_summary (text)
├── emphasized_skills (jsonb)
├── selected_experiences (jsonb)
└── generation_duration_ms (integer)

analyses
├── id (uuid)
├── user_id (uuid, FK)
├── source_type (enum: 'resume' | 'profile')
├── source_resume_id (uuid, FK)
├── company_id (uuid, FK)
├── job_id (uuid, FK)
├── analysis_type (enum: 'general' | 'job-fit')
├── score (integer)
├── fit_rating (enum: 'excellent' | 'good' | 'moderate' | 'poor')
├── summary (text)
├── strengths (jsonb)
├── improvements (jsonb)
├── categories (jsonb)
├── missing_keywords (jsonb)
├── transferable_skills (jsonb)
├── targeted_suggestions (jsonb)
├── duration_ms (integer)
└── created_at (timestamp)

activity_log
├── id (uuid)
├── user_id (uuid, FK)
├── action (text)  -- 'analyze', 'generate', 'upload', etc.
├── entity_type (text)  -- 'resume', 'profile', 'company', etc.
├── entity_id (uuid)
├── duration_ms (integer)  -- searchable, not in JSONB
├── source_type (text)
├── related_job_id (uuid)
├── related_company_id (uuid)
├── display_title (text)  -- human-readable
├── details (jsonb)  -- overflow
└── created_at (timestamp)
```

**Row Level Security (RLS):**

- Users can only access their own data
- Policies enforce user_id matching authenticated user

### Authentication Flow

1. User logs in via Supabase Auth (frontend)
2. Supabase returns session with JWT token
3. Frontend sends JWT in `Authorization: Bearer <token>` header
4. Express backend verifies JWT with Supabase
5. Backend queries database with verified user_id

### API Communication

**REST API Design:**

- Backend exposes RESTful endpoints
- Frontend uses React Query for data fetching/caching
- Environment variables for API URL configuration

**Frontend Environment:**

```env
VITE_API_URL=http://localhost:3000      # Dev
VITE_API_URL=https://api.resumerator.com  # Prod
VITE_SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
```

**Backend Environment:**

```env
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
ANTHROPIC_API_KEY=...
PORT=3000
```

## Project Structure

```
resumerator-9000/
├── frontend/                      # Vite React app
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── auth/            # Login, SignUp
│   │   │   ├── layout/          # Header, Sidebar, MainLayout
│   │   │   └── shared/          # MarkdownEditor, AIProgressBar, LoadingSpinner
│   │   ├── pages/               # Page components
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── ResumesPage.tsx
│   │   │   ├── ResumeDetailPage.tsx
│   │   │   ├── AnalyzePage.tsx
│   │   │   ├── GeneratePage.tsx
│   │   │   ├── HistoryPage.tsx
│   │   │   ├── CompaniesPage.tsx
│   │   │   ├── CompanyDetailPage.tsx
│   │   │   ├── JobsPage.tsx
│   │   │   ├── JobDetailPage.tsx
│   │   │   └── AnalysisDetailPage.tsx  # NEW: View saved analysis
│   │   ├── contexts/            # React contexts
│   │   ├── services/
│   │   │   ├── api.ts           # API client with all endpoints
│   │   │   └── supabase.ts      # Supabase client
│   │   └── theme/               # Mantine theme
│   ├── package.json
│   └── vite.config.ts
├── backend/                       # Express API
│   ├── src/
│   │   ├── agents/              # AI agents
│   │   │   ├── base-agent.ts
│   │   │   ├── general-agent.ts
│   │   │   ├── job-fit-agent.ts
│   │   │   ├── builder-agent.ts
│   │   │   └── import-agent.ts
│   │   ├── parsers/             # PDF/DOCX parsers
│   │   ├── middleware/          # Auth, CORS, error handling
│   │   ├── routes/              # API endpoints
│   │   │   ├── profile.routes.ts
│   │   │   ├── resumes.routes.ts
│   │   │   ├── companies.routes.ts
│   │   │   ├── jobs.routes.ts
│   │   │   ├── analyses.routes.ts  # First-class analysis results
│   │   │   ├── activity.routes.ts  # NEW: Activity log
│   │   │   └── ai.routes.ts        # NEW: Unified AI operations
│   │   ├── services/
│   │   │   ├── activity.service.ts  # NEW: Activity logging
│   │   │   └── supabase.service.ts
│   │   └── web/
│   │       └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── docs/                         # Documentation
│   ├── architecture.md          # This file
│   ├── tech-stack.md            # Tech stack details
│   └── plans/                   # Implementation plans
│       └── ui-overhaul-plan.md
└── resume-data/                 # Legacy data files
```

## Frontend Pages & Navigation

### Sidebar Navigation

- **Dashboard** - Overview with statistics and quick actions
- **Profile** - Comprehensive professional profile (markdown)
- **Resumes** - List all resumes with metadata (clickable cards)
- **Companies** - Company research notes (clickable cards)
- **Jobs** - Job descriptions (clickable cards)
- **Analyze** (NEW) - AI analysis of resumes/profile with optional job/company context
- **Generate** (NEW) - AI-powered tailored resume generation
- **History** - Past AI operations with duration tracking

### Routing Architecture

- **State-based routing** via App.tsx (no URL routing)
- Navigation handled by `onNavigate(page, state?)` callbacks
- Page state passes IDs and pre-selected values between pages
- Detail pages support pre-selection for deep linking from other pages

### Key UX Features

- **Clickable cards** on list pages (removed separate Edit/Delete buttons)
- **Delete moved to detail pages** (top action bar alongside Save)
- **Rich metadata** on cards (company names, job titles, timestamps with time)
- **Progress indicators** for AI operations (estimated progress + silly messages)
- **Markdown editor** with Edit/Preview/Split modes and formatting toolbar

## Data Storage Strategy

**Current:** Database-first with Supabase PostgreSQL
**Format:** Markdown content stored as TEXT fields

**Storage Details:**

- All content stored as markdown in database TEXT fields
- Preserve human-readable format
- Multi-user support with RLS
- Duration tracking for AI operations in JSONB metadata

## Deployment

### Frontend (Vercel)

1. Connect GitHub repository
2. Set build command: `cd frontend && npm run build`
3. Set output directory: `frontend/dist`
4. Add environment variables
5. Deploy automatically on push

### Backend (Railway)

1. Connect GitHub repository
2. Set start command: `npm start`
3. Set root directory: `backend`
4. Add environment variables
5. Deploy automatically on push

### Database (Supabase)

1. Create new project
2. Run migration scripts to create tables
3. Enable RLS policies
4. Configure authentication providers
5. Copy connection details to backend .env

## Key Features

### AI Agents

- **Review Agent**: Analyzes resumes against job descriptions
- **Builder Agent**: Generates tailored resumes
- **Import Agent**: Parses PDF/DOCX to markdown

### Parsers

- PDF parsing via pdf-parse
- DOCX parsing via mammoth
- Structured markdown output

### User Management

- Single-user workspaces
- Supabase authentication
- Row-level security

## Security Considerations

- JWT token verification on every API request
- RLS policies prevent unauthorized access
- API keys stored in environment variables
- CORS configured for frontend domain only
- No sensitive data in git repository

## Performance Considerations

- React Query for client-side caching
- Reduced API calls through intelligent caching
- Long-running AI operations don't block UI
- Streaming responses possible with WebSockets (future)

## Future Enhancements

- WebSocket streaming for AI responses
- Redis caching for frequently accessed data
- Background job queues (Bull/BullMQ)
- Multi-user collaboration features
- Export to PDF/DOCX formats
