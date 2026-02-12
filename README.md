# Resumerator 9000

AI-powered resume review and generation tool with decoupled frontend and backend architecture.

## Features

- **Resume Import**: Parse existing resumes (PDF/DOCX) into structured markdown
- **Job Description Processing**: AI structures job postings into clean markdown
- **Company Info Processing**: Organize company research into markdown
- **Markdown Editor**: Edit files with live preview (split view)
- **Resume Review**: Analyze resumes with optional company/job context
- **Resume Builder**: Generate tailored resumes for specific jobs
- **Results History**: Track past analyses
- **Multi-user Support**: Each user has their own workspace (via Supabase Auth)

## Architecture

**Frontend**: Vite + React on Vercel  
**Backend**: Express API on Railway  
**Database**: Supabase (PostgreSQL + Auth)  
**AI**: Anthropic Claude API

See [Architecture Documentation](docs/architecture.md) for detailed information.

## Tech Stack

**Frontend**:

- React 18, TypeScript
- Mantine UI, Zustand, React Query
- Vite

**Backend**:

- Node.js, Express, TypeScript
- Anthropic SDK, pdf-parse, mammoth

See [Tech Stack](docs/tech-stack.md) for complete package list.

## Quick Start

### Prerequisites

- Node.js 18+
- Anthropic API key
- Supabase account (free tier works)

### Setup

1. **Clone and install dependencies:**

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

2. **Set up environment variables:**

Backend (`.env` in `backend/`):

```env
PORT=3000
ANTHROPIC_API_KEY=your-anthropic-key
SUPABASE_URL=your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

Frontend (`.env` in `frontend/`):

```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

3. **Generate TypeScript types from Supabase schema:**

```bash
cd backend

# One-time: authenticate with Supabase CLI
npx supabase login

# Generate types (run after each migration)
npm run db:types
```

This creates `backend/src/types/database.ts` with full type safety for all database operations.

4. **Run in development:**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

## Project Structure

```
resumerator-9000/
├── frontend/              # Vite React app
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API & Supabase clients
│   │   ├── hooks/        # Custom hooks
│   │   └── store/        # Zustand state
│   └── package.json
├── backend/              # Express API
│   ├── src/
│   │   ├── agents/      # AI agents
│   │   ├── parsers/     # PDF/DOCX parsers
│   │   └── web/         # Express server
│   └── package.json
├── docs/                 # Documentation
│   ├── architecture.md   # Architecture decisions
│   └── tech-stack.md     # Tech stack details
└── resume-data/          # Legacy data files
```

## Deployment

### Backend (Railway)

1. Connect GitHub repository
2. Set root directory to `backend`
3. Add environment variables
4. Deploy

### Frontend (Vercel)

1. Connect GitHub repository
2. Set build command: `cd frontend && npm run build`
3. Set output directory: `frontend/dist`
4. Add environment variables
5. Deploy

### Database (Supabase)

1. Create new project
2. Run migration scripts
3. Enable Row Level Security
4. Configure authentication

## Documentation

- [Architecture Documentation](docs/architecture.md) - System design and decisions
- [Tech Stack](docs/tech-stack.md) - Technologies and packages
- [Development Plans](docs/plans/) - Historical development plans

## CLI Usage (Legacy)

```bash
cd backend

# Review
npm run cli review --person john-doe --job acme-corp/senior-engineer

# Build tailored resume
npm run cli build --person john-doe --job acme-corp/senior-engineer --save
```

## Requirements

- Node.js 18+
- Anthropic API key
- Supabase account

## License

MIT
