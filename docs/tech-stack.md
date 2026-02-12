# Tech Stack

## Frontend

### Core Framework

- **Vite 6** - Build tool and dev server
- **React 18** - UI framework
- **TypeScript** - Type safety

### UI & Styling

- **Mantine UI 7** - Component library
  - `@mantine/core` - Core components
  - `@mantine/hooks` - Utility hooks
  - `@mantine/form` - Form management
  - `@mantine/notifications` - Toast notifications
- **@tabler/icons-react** - Icon library
- **PostCSS** - CSS processing
  - `postcss-preset-mantine` - Mantine-specific presets
  - `postcss-simple-vars` - CSS variables

### State Management

- **Zustand** - Client state (UI state, app preferences)
- **React Query (TanStack Query)** - Server state (API calls, caching)

### Data & API

- **Supabase JS Client** - Authentication only
- **Marked v11** - Markdown parsing/rendering
  - Used in MarkdownEditor for live preview
  - Powers preview mode in all markdown editing interfaces

### Key Components

- **MarkdownEditor** - Full-featured markdown editor with:
  - Three view modes: Edit, Preview, Split
  - Formatting toolbar (headings, bold, italic, lists, links, code blocks)
  - Fixed-height scrollable container for better UX
  - Live preview with `TypographyStylesProvider`
  
- **AIProgressBar** - Progress indicator for long-running AI operations:
  - Curved progress animation (0-30% quick, 30-60% moderate, 60-95% slow)
  - Rotating humorous status messages
  - Real-time elapsed time display
  - Adaptive to operation type (analyze, generate, enrich)

### Development Tools

- **@vitejs/plugin-react** - React integration for Vite
- **TypeScript** - Type definitions

---

## Backend

### Core Framework

- **Node.js 18+** - Runtime
- **Express 4** - Web framework
- **TypeScript** - Type safety

### AI & Processing

- **@anthropic-ai/sdk** - Claude API integration
- **pdf-parse** - PDF document parsing
- **mammoth** - DOCX document parsing
- **marked** - Markdown processing

### API & Middleware

- **multer** - File upload handling
- **dotenv** - Environment variable management
- **CORS** - Cross-origin resource sharing (to be added)

### Database & Auth

- **Supabase JS Client** - Database queries and auth verification
  - Admin SDK for server-side operations

### Development Tools

- **ts-node** - TypeScript execution for development
- **@types/express** - Express type definitions
- **@types/multer** - Multer type definitions
- **@types/node** - Node.js type definitions

---

## Infrastructure

### Hosting

- **Vercel** - Frontend static site hosting
- **Railway** - Backend API hosting
- **Supabase** - Database and authentication

### Database

- **PostgreSQL** (via Supabase)
  - Row Level Security (RLS)
  - Built-in authentication
  - RESTful API

### External APIs

- **Anthropic Claude API** - AI language model
  - Model: Claude 3.5 Sonnet (configurable)
  - Long-form text generation
  - Document analysis

---

## Development Workflow

### Package Management

- **npm** - Package manager (both frontend and backend)

### Version Control

- **Git** - Source control
- **GitHub** - Repository hosting

### Development Commands

**Frontend:**

```bash
npm run dev     # Start dev server (http://localhost:5173)
npm run build   # Build for production
npm run preview # Preview production build
```

**Backend:**

```bash
npm run dev     # Start dev server with ts-node
npm run build   # Compile TypeScript
npm start       # Run production build
npm run cli     # Run CLI commands
```

---

## Environment Variables

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### Backend (.env)

```env
PORT=3000
ANTHROPIC_API_KEY=your-api-key
SUPABASE_URL=your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
NODE_ENV=development
```

---

## Future Additions

### Planned Dependencies

- **@supabase/supabase-js** - Enhanced Supabase integration
- **cors** - CORS middleware for Express
- **helmet** - Security headers
- **compression** - Response compression
- **winston** - Logging
- **joi** or **zod** - Runtime validation

### Potential Enhancements

- **Bull/BullMQ** - Background job processing
- **Redis** - Caching layer
- **Socket.io** - Real-time streaming
- **react-pdf** - PDF preview in frontend
- **react-hook-form** - Alternative form management
- **Sentry** - Error tracking

---

## Package Versions

### Frontend

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "@mantine/core": "^7.15.1",
  "@mantine/hooks": "^7.15.1",
  "@mantine/form": "^7.15.1",
  "@mantine/notifications": "^7.15.1",
  "@tabler/icons-react": "^3.26.0",
  "marked": "^11.0.0",
  "zustand": "^5.0.2",
  "vite": "^6.0.0",
  "typescript": "^5.7.3"
}
```

### Backend

```json
{
  "@anthropic-ai/sdk": "^0.39.0",
  "express": "^4.21.2",
  "dotenv": "^16.4.7",
  "pdf-parse": "^1.1.1",
  "mammoth": "^1.8.0",
  "marked": "^17.0.1",
  "multer": "^1.4.5-lts.1",
  "cors": "^2.8.6",
  "ts-node": "^10.9.2",
  "typescript": "^5.7.3"
}
```

---

## Architecture Patterns

### Frontend Patterns

- **Component-based architecture** - Modular React components
- **Custom hooks** - Reusable logic
- **Service layer** - API abstraction
- **Store pattern** - Centralized state with Zustand
- **Query pattern** - Server state with React Query
- **Page-based routing** - State-based navigation with App.tsx router
- **Shared components** - Reusable UI components (MarkdownEditor, AIProgressBar, ThemePicker, LoadingSpinner)
- **Personality theming system** - Zustand store with localStorage persistence + DB sync
  - `AppTheme` type defines personality presets (colors, gradients, silly messages, feature descriptions)
  - 4 themes: Default (purple), Robot (cyan/technical), Designer (rose/artsy), Fairies (lavender/whimsical)
  - Theme ID stored in `profiles.theme_id` for cross-device sync
  - localStorage cache prevents flash on load
  - Extensible for future SVGs, component variants, animations

### Backend Patterns

- **MVC-like structure** - Routes, services, agents (controllers)
- **Middleware pattern** - Auth, error handling, logging
- **Agent pattern** - Specialized AI agents for different tasks (JobFitAgent, GeneralResumeAgent, ResumeBuilderAgent)
- **Parser abstraction** - Unified interface for different file types
- **Service layer** - `activity.service.ts` for centralized activity logging (fire-and-forget)
- **Duration tracking** - All AI operations track `duration_ms` as first-class columns
- **Activity logging** - All user actions automatically logged to `activity_log` table

### API Endpoints

#### Core Resources
- `/api/profile` - User profile management + enrich operation
- `/api/resumes` - Resume CRUD + upload/parse operations
- `/api/companies` - Company CRUD + parsing
- `/api/jobs` - Job CRUD + parsing
- `/api/analyses` - First-class analysis results (queryable, structured)
  - `GET /api/analyses` - List with filters (sourceType, jobId, analysisType, minScore)
  - `GET /api/analyses/:id` - Get specific analysis with full details
  - `DELETE /api/analyses/:id` - Delete an analysis
- `/api/activity` - Activity log (audit trail)
  - `GET /api/activity` - List with filters (action, entityType, entityId)

#### AI Operations
- `/api/ai/analyze` - Unified analysis endpoint
  - Accepts `source: 'resume' | 'profile'`
  - Optional job/company context
  - Creates structured `analyses` entry with score, fit_rating, strengths, etc.
  - Logs activity automatically
- `/api/ai/generate` - Unified generation endpoint
  - Accepts `source: 'resume' | 'profile'`
  - Requires job ID for tailoring
  - Creates new resume with full provenance tracking (origin, source_type, generation metadata)
  - Logs activity automatically

---

## Code Quality Tools

### Planned Additions

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit linting

---

## Testing Strategy (Future)

### Frontend

- **Vitest** - Unit testing
- **Testing Library** - Component testing
- **Playwright** - E2E testing

### Backend

- **Jest** - Unit testing
- **Supertest** - API endpoint testing

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## Node.js Version

- **Minimum:** 18.0.0
- **Recommended:** 20.x LTS
