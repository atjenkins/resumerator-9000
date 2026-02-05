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

results
├── id (uuid)
├── user_id (uuid, FK)
├── type (enum: 'review' | 'build')
├── person_name (text)
├── company_name (text)
├── job_title (text)
├── content (text)  -- markdown result
├── created_at (timestamp)
└── metadata (jsonb)  -- flexible data
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
│   │   ├── hooks/                # Custom hooks
│   │   ├── services/
│   │   │   ├── api.ts           # React Query hooks
│   │   │   └── supabase.ts      # Supabase client
│   │   ├── store/               # Zustand state
│   │   └── theme/               # Mantine theme
│   ├── package.json
│   └── vite.config.ts
├── backend/                       # Express API
│   ├── src/
│   │   ├── agents/              # AI agents
│   │   ├── parsers/             # PDF/DOCX parsers
│   │   ├── middleware/          # Auth, CORS
│   │   ├── routes/              # API endpoints
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── docs/                         # Documentation
│   ├── architecture.md          # This file
│   └── tech-stack.md            # Tech stack details
└── resume-data/                 # Legacy data files
```

## Data Storage Strategy

**Current:** File-based markdown in `resume-data/`
**Target:** Markdown content stored in Supabase PostgreSQL

**Migration Path:**

- Keep markdown editing workflow
- Store markdown as TEXT in database
- Preserve human-readable format
- Enable multi-user support

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
