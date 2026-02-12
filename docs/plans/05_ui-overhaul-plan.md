# UI Overhaul Plan

> Implementation plan for frontend/backend improvements.
> Execute phases in order. Check off tasks as completed.

---

## Phase 1: Clickable Cards + Metadata Enrichment

**Goal**: List page cards are clickable to open detail pages, show richer metadata, and remove Edit/Delete buttons from cards (delete moves to detail pages).

### 1A. ResumesPage.tsx

- [x] Make the entire `Card` clickable via `onClick` → navigates to `resume-detail`
- [x] Add hover/cursor styling to indicate clickability
- [x] Remove the Edit and Delete buttons from each card
- [x] Fetch companies and jobs lists on mount to resolve `company_id`/`job_id` to display names
- [x] Add `updated_at` to the `Resume` interface
- [x] Display on each card:
  - Company name as a subtle badge (if linked)
  - Job title as a subtle badge (if linked)
  - Created date **with time** (`toLocaleString()`)
  - Updated date with time (if different from created)

### 1B. JobsPage.tsx

- [x] Make cards clickable → navigates to `job-detail`
- [x] Add hover/cursor styling
- [x] Remove Edit and Delete buttons from cards
- [x] Fetch companies list on mount to resolve `company_id` to name
- [x] Replace the generic `<Badge>Linked to company</Badge>` with the actual company name
- [x] Add `updated_at` to interface, display created + updated timestamps with time

### 1C. CompaniesPage.tsx

- [x] Make cards clickable → navigates to `company-detail`
- [x] Add hover/cursor styling
- [x] Remove Edit and Delete buttons from cards
- [x] Add `updated_at` to interface, display created + updated timestamps with time

### 1D. Add Delete to Detail Pages

Since delete buttons are being removed from list cards, add delete capability to each detail page:

- [x] **ResumeDetailPage.tsx**: Add a Delete button (red, with confirmation) in the top action bar next to Save. On delete, navigate back to resumes list.
- [x] **JobDetailPage.tsx**: Add a Delete button in the top action bar. On delete, navigate back to jobs list.
- [x] **CompanyDetailPage.tsx**: Add a Delete button in the top action bar. On delete, navigate back to companies list.
- [x] Import `deleteResume`, `deleteJob`, `deleteCompany` from api.ts into the respective detail pages

### Files touched (6):

- `frontend/src/pages/ResumesPage.tsx`
- `frontend/src/pages/JobsPage.tsx`
- `frontend/src/pages/CompaniesPage.tsx`
- `frontend/src/pages/ResumeDetailPage.tsx`
- `frontend/src/pages/JobDetailPage.tsx`
- `frontend/src/pages/CompanyDetailPage.tsx`

---

## Phase 2: Markdown Editor Overhaul

**Goal**: Replace the minimal `MarkdownEditor` with a proper editor featuring a formatting toolbar, view modes (edit/preview/split), and larger default size.

### 2A. Dependencies

- No new npm packages needed. `marked` v11 is already in `package.json`.
- Use Mantine's `TypographyStylesProvider` to style rendered HTML.

### 2B. Rewrite MarkdownEditor.tsx

- [x] **View mode toggle** using Mantine `SegmentedControl` with three options:
  - **Edit** — textarea only (full width)
  - **Preview** — rendered markdown only (full width)
  - **Split** — side-by-side edit + preview (50/50)

- [x] **Toolbar** — row of icon buttons above the editor area:
  - H1 (`# `), H2 (`## `), H3 (`### `) — insert at line start
  - Bold (`**text**`) — wrap selection or insert placeholder
  - Italic (`*text*`) — wrap selection or insert placeholder
  - Bullet list (`- `) — insert at line start
  - Numbered list (`1. `) — insert at line start
  - Horizontal rule (`\n---\n`) — insert at cursor
  - Link (`[text](url)`) — wrap selection or insert placeholder
  - Code block (`` ``` ``) — wrap selection or insert placeholder
  - Each button operates on cursor position / selected text in the textarea

- [x] **Size**: Use a fixed height container (~500px) with overflow scroll. The preview pane should match the edit pane height. Remove `autosize` in favor of a fixed, scrollable area.

- [x] **Preview rendering**: Use `marked.parse(content)` rendered inside Mantine's `TypographyStylesProvider` with `dangerouslySetInnerHTML`.

- [x] **Props**: Keep the existing interface (`value`, `onChange`, `onSave`, `saving`, `placeholder`, `minRows`) and add:
  - `defaultView?: 'edit' | 'preview' | 'split'` (default: `'edit'`)
  - `height?: number | string` (default: `500`)

### 2C. Adopt MarkdownEditor in Detail Pages

Currently `ResumeDetailPage`, `CompanyDetailPage`, and `JobDetailPage` use raw `Textarea` with `minRows={20}`. Replace each with the upgraded `MarkdownEditor`.

- [x] **ResumeDetailPage.tsx**: Replace the `Textarea` for resume content with `MarkdownEditor`. Remove the inline save-from-textarea pattern — the page-level Save button handles saving.
- [x] **CompanyDetailPage.tsx**: Replace `Textarea` with `MarkdownEditor`.
- [x] **JobDetailPage.tsx**: Replace `Textarea` with `MarkdownEditor`.
- [x] **ProfilePage.tsx**: Already uses `MarkdownEditor` — verify it picks up the upgrade cleanly. Adjust props if needed.

### Files touched (5):

- `frontend/src/components/shared/MarkdownEditor.tsx` (rewrite)
- `frontend/src/pages/ResumeDetailPage.tsx`
- `frontend/src/pages/CompanyDetailPage.tsx`
- `frontend/src/pages/JobDetailPage.tsx`
- `frontend/src/pages/ProfilePage.tsx`

---

## Phase 3: Separate Analyze & Generate Pages

**Goal**: AI operations become their own top-level sections in the sidebar, where the user selects inputs (resume or profile, optional job/company context).

### 3A. Backend: New unified AI routes

Create `backend/src/routes/ai.routes.ts`:

- [x] **`POST /api/ai/analyze`**
  ```
  Body: {
    source: 'resume' | 'profile',
    resumeId?: string,       // required if source = 'resume'
    companyId?: string,       // optional context
    jobId?: string,           // optional context
    save?: boolean            // default true
  }
  ```
  Logic:
  - If `source === 'resume'` → fetch resume by ID, verify ownership
  - If `source === 'profile'` → fetch user's profile content
  - Resolve optional company/job context (fetch from DB if IDs provided)
  - Run `JobFitAgent.review()` if job/company context present, else `GeneralResumeAgent.review()`
  - Track `duration_ms` (start timer before agent call, stop after)
  - If `save` → insert into `results` table with `type: 'review'`, include `duration_ms` in `metadata`
  - Return `{ ...result, duration_ms, savedResultId? }`

- [x] **`POST /api/ai/generate`**
  ```
  Body: {
    source: 'resume' | 'profile',
    resumeId?: string,       // required if source = 'resume'
    jobId: string,            // required
    companyId?: string,       // optional, auto-resolved from job if not provided
    save?: boolean            // default true
  }
  ```
  Logic:
  - If `source === 'resume'` → fetch resume content
  - If `source === 'profile'` → fetch profile content
  - Fetch job (with company join via `select("*, companies(*)")`)
  - Run `ResumeBuilderAgent.build()`
  - Track `duration_ms`
  - If `save` → create new resume entry (titled `"{source title} - {job title}"`) + insert into `results` table with `type: 'build'`, include `duration_ms` in `metadata`
  - Return `{ ...result, duration_ms, savedResultId?, tailoredResumeId? }`

### 3B. Backend: Register routes

- [x] In `backend/src/web/server.ts`: import and mount `app.use("/api/ai", aiRoutes)`

### 3C. Frontend: New API functions

- [x] Add to `frontend/src/services/api.ts`:
  ```typescript
  export async function analyzeDocument(data: {
    source: 'resume' | 'profile';
    resumeId?: string;
    companyId?: string;
    jobId?: string;
    save?: boolean;
  }) { ... }

  export async function generateResume(data: {
    source: 'resume' | 'profile';
    resumeId?: string;
    jobId: string;
    companyId?: string;
    save?: boolean;
  }) { ... }
  ```

### 3D. Frontend: AnalyzePage.tsx (new file)

- [x] **Source selector**: Radio group — "Use Resume" / "Use Profile"
  - If "Use Resume": show a `Select` dropdown of user's resumes
  - If "Use Profile": show the profile display name, no further selection
- [x] **Context selectors** (optional):
  - Company dropdown (`Select`, clearable)
  - Job dropdown (`Select`, clearable)
- [x] **Run button**: "Analyze" — calls `analyzeDocument()`
- [x] **Results display area**: Renders analysis result inline after completion:
  - Overall score (large number or gauge)
  - Summary text
  - Categories with individual scores and feedback
  - Strengths list
  - Improvements list
- [x] Fetch resumes, companies, jobs, and profile on mount for the dropdowns
- [x] Accept optional `pageState.resumeId` to pre-select a resume (for navigation from ResumeDetailPage)

### 3E. Frontend: GeneratePage.tsx (new file)

- [x] **Source selector**: Radio group — "Use Resume" / "Use Profile"
  - If "Use Resume": show a `Select` dropdown of user's resumes
  - If "Use Profile": show the profile display name
- [x] **Job selector** (required): `Select` dropdown of jobs
- [x] **Company selector** (optional, auto-fills from job's `company_id` if available)
- [x] **Run button**: "Generate Tailored Resume" — calls `generateResume()`
- [x] **Results display area**: After completion:
  - Show the generated markdown in a preview (use MarkdownEditor in preview mode)
  - Summary of tailoring decisions
  - List of emphasized skills and selected experiences
  - "View New Resume" button that navigates to the newly created resume's detail page
- [x] Fetch resumes, companies, jobs, and profile on mount
- [x] Accept optional `pageState.resumeId` to pre-select a resume

### 3F. Frontend: Sidebar.tsx update

- [x] Add two new nav items after "Jobs" and before "History":
  - `{ value: "analyze", label: "Analyze", icon: IconReportAnalytics }`
  - `{ value: "generate", label: "Generate", icon: IconSparkles }`
- [x] Import new icons from `@tabler/icons-react`

### 3G. Frontend: App.tsx routing

- [x] Import `AnalyzePage` and `GeneratePage`
- [x] Add switch cases in `renderPage()`:
  ```
  case "analyze":
    return <AnalyzePage onNavigate={handleNavigate} preSelectedResumeId={pageState?.resumeId} />;
  case "generate":
    return <GeneratePage onNavigate={handleNavigate} preSelectedResumeId={pageState?.resumeId} />;
  ```

### 3H. Update ResumeDetailPage.tsx

- [x] Remove the "AI Operations" card entirely (the inline Analyze/Tailor buttons)
- [x] Add two navigation buttons in its place (or in the header area):
  - "Analyze this Resume" → navigates to `analyze` page with `{ resumeId: resumeId }`
  - "Generate from this Resume" → navigates to `generate` page with `{ resumeId: resumeId }`
- [x] These can be styled as outlined/light buttons to differentiate from the Save action

### Files touched (8):

- `backend/src/routes/ai.routes.ts` **(new)**
- `backend/src/web/server.ts`
- `frontend/src/services/api.ts`
- `frontend/src/pages/AnalyzePage.tsx` **(new)**
- `frontend/src/pages/GeneratePage.tsx` **(new)**
- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/App.tsx`
- `frontend/src/pages/ResumeDetailPage.tsx`

---

## Phase 4: Progress Indicators

**Goal**: Replace spinning circles with estimated progress bars and silly rotating status messages for long-running AI operations.

### 4A. New shared component: AIProgressBar.tsx

- [x] Create `frontend/src/components/shared/AIProgressBar.tsx`
- [x] Props:
  ```typescript
  interface AIProgressBarProps {
    isRunning: boolean;
    operationType: 'analyze' | 'generate' | 'enrich';
    onComplete?: () => void;  // callback when operation finishes
  }
  ```
- [x] **Progress bar**: Mantine `Progress` component that advances on a time-based curve:
  - 0→30% quickly (first ~5s)
  - 30→60% moderate (next ~15s)
  - 60→80% slower (next ~20s)
  - 80→92% crawl (next ~15s)
  - 92→95% very slow (safety buffer)
  - Jumps to 100% when `isRunning` becomes `false`
- [x] **Elapsed time counter**: Show "12s elapsed" below the bar, updating every second
- [x] **Rotating silly status messages** that cycle every 3-4 seconds:

  **Analyze messages:**
  - "Reticulating career splines..."
  - "Consulting the resume oracle..."
  - "Cross-referencing buzzwords with the cosmos..."
  - "Calibrating achievement metrics..."
  - "Scanning for dangerously high synergy levels..."
  - "Decrypting your professional potential..."
  - "Asking the AI if it's impressed yet..."
  - "Counting action verbs per paragraph..."
  - "Comparing your skills to a very long spreadsheet..."
  - "Feeding your resume to a very sophisticated hamster wheel..."

  **Generate messages:**
  - "Assembling your professional narrative..."
  - "Optimizing bullet point velocity..."
  - "Aligning achievement matrices..."
  - "Polishing professional prose to a fine sheen..."
  - "Teaching the AI to humble-brag on your behalf..."
  - "Converting coffee-fueled effort into metrics..."
  - "Sprinkling in just the right amount of synergy..."
  - "Crafting the perfect amount of buzzword density..."
  - "Convincing the algorithm you're a team player AND a self-starter..."
  - "Translating 'wore many hats' into something more impressive..."

  **Enrich messages:**
  - "Absorbing your professional essence..."
  - "Cataloging years of hard-won experience..."
  - "Teaching the AI about your career journey..."
  - "Converting your achievements into structured data..."
  - "Parsing decades of hustle..."
  - "Indexing your professional awesomeness..."
  - "Untangling your career spaghetti into something beautiful..."
  - "Filing your skills in alphabetical order... just kidding..."

### 4B. Timer tracking in backend

- [x] In `ai.routes.ts` — already tracking `duration_ms` from Phase 3. Ensure it's stored in `results.metadata.duration_ms`
- [x] Return `duration_ms` in the response body

### 4C. Display duration on HistoryPage

- [x] In `HistoryPage.tsx`: parse `metadata` from each analysis result
- [x] Display "Completed in Xs" next to the timestamp if `duration_ms` is available
- [x] Format nicely (e.g., "Completed in 34s" or "Completed in 1m 12s")

### 4D. Integrate AIProgressBar into pages

- [x] **AnalyzePage.tsx**: Show `AIProgressBar` while `analyzing === true`
- [x] **GeneratePage.tsx**: Show `AIProgressBar` while `generating === true`
- [x] **ProfilePage.tsx**: Show `AIProgressBar` while `enriching === true` (for the file upload enrich flow)

### Files touched (5):

- `frontend/src/components/shared/AIProgressBar.tsx` **(new)**
- `frontend/src/pages/AnalyzePage.tsx` (integrate)
- `frontend/src/pages/GeneratePage.tsx` (integrate)
- `frontend/src/pages/ProfilePage.tsx` (integrate)
- `frontend/src/pages/HistoryPage.tsx` (show duration)

---

## Phase 5: Documentation Updates

- [x] Update `docs/tech-stack.md`:
  - Add new AI routes (`/api/ai/analyze`, `/api/ai/generate`) to the endpoints section
  - Note the `MarkdownEditor` component upgrade and view modes
  - Note `AIProgressBar` component
- [x] Update `docs/architecture.md`:
  - Add Analyze and Generate pages to the frontend page list
  - Add `ai.routes.ts` to the backend routes overview
  - Note the sidebar navigation changes

### Files touched (2):

- `docs/tech-stack.md`
- `docs/architecture.md`

---

## Execution Summary

| Phase | Scope  | Files Changed | New Files | Backend Changes |
|-------|--------|---------------|-----------|-----------------|
| 1     | Small  | 6             | 0         | No              |
| 2     | Medium | 5             | 0         | No              |
| 3     | Large  | 5             | 3         | Yes (new routes)|
| 4     | Medium | 4             | 1         | Minor (timing)  |
| 5     | Small  | 2             | 0         | No              |

**Total**: ~19 files changed, 4 new files created.

**Execute in order**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5.

Phases 1 and 2 are independent and could be parallelized if desired. Phase 4 depends on Phase 3's new pages. Phase 5 is last.
