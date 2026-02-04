# Plan 04: React + Vite + Mantine Frontend Migration

## Overview
Migrate the 1797-line monolithic `index.html` to a modern React + Vite + Mantine component-based architecture. Complete migration in one atomic change.

## Goals
1. Break down monolithic HTML into 30+ small, maintainable React components
2. Implement proper TypeScript typing throughout frontend
3. Use Mantine UI components for consistency and polish
4. Set up Zustand for state management
5. Maintain all existing functionality
6. Improve developer experience with hot reload and fast builds

## Current State
- Single `index.html` file: 1797 lines
- Inline JavaScript with manual DOM manipulation
- Direct fetch API calls
- No component reusability
- No type safety on frontend
- Mixed HTML/CSS/JS in one file

## Target Architecture

```
resume-reviewer/
├── client/                          # NEW React app
│   ├── src/
│   │   ├── main.tsx                 # Entry point
│   │   ├── App.tsx                  # Root component
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Navigation.tsx
│   │   │   ├── data-manager/
│   │   │   │   ├── DataManagerTab.tsx
│   │   │   │   ├── ResumeImport.tsx
│   │   │   │   ├── JobProcessor.tsx
│   │   │   │   ├── CompanyProcessor.tsx
│   │   │   │   └── MarkdownEditor.tsx
│   │   │   ├── review/
│   │   │   │   ├── ReviewTab.tsx
│   │   │   │   ├── ReviewForm.tsx
│   │   │   │   └── ReviewResults.tsx
│   │   │   ├── build/
│   │   │   │   ├── BuildTab.tsx
│   │   │   │   ├── BuildForm.tsx
│   │   │   │   └── BuildResults.tsx
│   │   │   ├── results/
│   │   │   │   ├── ResultsTab.tsx
│   │   │   │   ├── ResultsList.tsx
│   │   │   │   └── ResultCard.tsx
│   │   │   └── shared/
│   │   │       ├── SourceSelector.tsx
│   │   │       ├── FileUpload.tsx
│   │   │       ├── LoadingSpinner.tsx
│   │   │       └── AlertMessage.tsx
│   │   ├── hooks/
│   │   │   ├── useProject.ts
│   │   │   ├── useResults.ts
│   │   │   └── useApi.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── types.ts
│   │   ├── store/
│   │   │   └── index.ts
│   │   └── theme/
│   │       └── theme.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── src/
│   └── web/
│       ├── server.ts                # Updated to serve React build
│       └── public/
│           └── index.html           # Minimal loader (kept for backward compat)
└── package.json                     # Updated with new scripts
```

## Implementation Steps

### Phase 1: Setup & Configuration (30 min)
- [x] Create plan file
- [ ] Initialize Vite React TypeScript project in `client/` folder
- [ ] Install dependencies:
  - Mantine core, hooks, form, notifications
  - Tabler icons
  - marked.js for markdown preview
  - zustand for state management
  - react-router-dom (optional, using state-based tabs initially)
- [ ] Configure Vite proxy to Express backend
- [ ] Set up Mantine theme matching current purple gradient design
- [ ] Configure TypeScript paths and settings

### Phase 2: Type Definitions & API Layer (1 hour)
- [ ] Create `services/types.ts` with all TypeScript interfaces
  - PersonInfo, CompanyInfo, JobInfo
  - ReviewResult, JobFitResult, BuilderResult
  - API request/response types
- [ ] Create `services/api.ts` with all API calls
  - Project APIs (people, companies, jobs)
  - Import APIs (resume, job, company)
  - File editing APIs
  - Review and Build APIs
  - Results APIs
- [ ] Create `hooks/useApi.ts` for generic API hook with loading/error states
- [ ] Create `hooks/useProject.ts` for project data management

### Phase 3: State Management (30 min)
- [ ] Create Zustand store (`store/index.ts`)
  - Selected person, company, job
  - Editor state (current file, dirty flag)
  - UI state (active tab, notifications)

### Phase 4: Layout Components (1 hour)
- [ ] `components/layout/AppShell.tsx` - Main layout wrapper
- [ ] `components/layout/Header.tsx` - Purple gradient header
- [ ] `components/layout/Navigation.tsx` - Tab navigation component

### Phase 5: Shared Components (1.5 hours)
- [ ] `components/shared/SourceSelector.tsx` - Radio group for project/text/file
- [ ] `components/shared/FileUpload.tsx` - Reusable file upload with drag & drop
- [ ] `components/shared/LoadingSpinner.tsx` - Loading states
- [ ] `components/shared/AlertMessage.tsx` - Success/error alerts

### Phase 6: Data Manager Tab (3 hours)
- [ ] `components/data-manager/DataManagerTab.tsx` - Container
- [ ] `components/data-manager/ResumeImport.tsx`
  - Create/Merge mode selection
  - File upload or text paste
  - Person selection for merge mode
  - Process with AI button
  - Result preview
- [ ] `components/data-manager/JobProcessor.tsx`
  - Create/Append mode selection
  - Company selection
  - Job name input or selection
  - JD text area
  - Process with AI button
- [ ] `components/data-manager/CompanyProcessor.tsx`
  - Create/Append mode selection
  - Company name input or selection
  - Company info text area
  - Process with AI button
- [ ] `components/data-manager/MarkdownEditor.tsx`
  - File type selector (person/company/job)
  - File dropdown
  - Split view editor + preview
  - Dirty state tracking
  - Save/Discard buttons

### Phase 7: Review Tab (2 hours)
- [ ] `components/review/ReviewTab.tsx` - Container
- [ ] `components/review/ReviewForm.tsx`
  - Resume source selector
  - Company context checkbox and fields
  - Job context checkbox and fields
  - Save result checkbox
  - Submit button
- [ ] `components/review/ReviewResults.tsx`
  - Score display
  - Summary section
  - Strengths list
  - Improvements list
  - Category breakdown cards
  - Missing keywords (if job-fit)

### Phase 8: Build Tab (2 hours)
- [ ] `components/build/BuildTab.tsx` - Container
- [ ] `components/build/BuildForm.tsx`
  - Personal info source selector
  - Job description source selector (required)
  - Company context checkbox and fields
  - Save result checkbox
  - Submit button
- [ ] `components/build/BuildResults.tsx`
  - Tailoring summary
  - Emphasized skills
  - Selected experiences
  - Generated resume markdown
  - Copy to clipboard button

### Phase 9: Results Tab (1.5 hours)
- [ ] `components/results/ResultsTab.tsx` - Container with filters
- [ ] `components/results/ResultsList.tsx` - Grid layout
- [ ] `components/results/ResultCard.tsx` - Individual result card
  - Type badge
  - Date
  - Metadata (person, company, job)
  - Click to view

### Phase 10: Root App Component (30 min)
- [ ] `App.tsx` - Main app component
  - Mantine provider setup
  - Notification provider
  - State initialization
  - Tab routing logic

### Phase 11: Update Backend (30 min)
- [ ] Update `server.ts` to serve React build in production
- [ ] Keep API endpoints unchanged
- [ ] Add static file serving for React build
- [ ] Update package.json scripts

### Phase 12: Build Configuration (30 min)
- [ ] Configure Vite to output to `dist/web/public`
- [ ] Update root package.json with new scripts:
  - `dev` - Run both server and client concurrently
  - `dev:client` - Run Vite dev server
  - `dev:server` - Run Express server
  - `build` - Build everything
  - `build:client` - Build React only
  - `build:server` - Build Express only
- [ ] Install concurrently for running both in dev

### Phase 13: Testing & Verification (2 hours)
- [ ] Test all Data Manager functions
  - Resume import (create and merge)
  - Job processing (create and append)
  - Company processing (create and append)
  - Markdown editor (load, edit, save)
- [ ] Test Review tab
  - All source combinations
  - With/without context
  - Result display
- [ ] Test Build tab
  - All source combinations
  - Result display
  - Copy functionality
- [ ] Test Results tab
  - Filtering
  - Display
- [ ] Verify all API integrations
- [ ] Check responsive design
- [ ] Test error handling

### Phase 14: Cleanup (30 min)
- [ ] Remove or archive old `index.html`
- [ ] Update README with new dev instructions
- [ ] Update IMPLEMENTATION_COMPLETE.md
- [ ] Commit everything

## Component Size Estimates

| Component | Lines | Complexity |
|-----------|-------|------------|
| Layout components | 150 | Low |
| Shared components | 200 | Low |
| Data Manager tab | 500 | Medium |
| Review tab | 300 | Medium |
| Build tab | 300 | Medium |
| Results tab | 200 | Low |
| Services/API | 300 | Medium |
| Hooks | 200 | Medium |
| Store | 100 | Low |
| **Total** | **~2250** | **Across 30+ files** |

## Key Technologies

- **React 18**: Component framework
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety
- **Mantine v7**: UI component library
- **Zustand**: State management
- **marked**: Markdown rendering
- **Tabler Icons**: Icon set
- **concurrently**: Run multiple npm scripts

## Dependencies to Install

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@mantine/core": "^7.15.1",
    "@mantine/hooks": "^7.15.1",
    "@mantine/form": "^7.15.1",
    "@mantine/notifications": "^7.15.1",
    "@tabler/icons-react": "^3.26.0",
    "marked": "^11.0.0",
    "zustand": "^5.0.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@types/marked": "^6.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.3",
    "vite": "^6.0.0",
    "concurrently": "^9.1.0"
  }
}
```

## Migration Benefits

1. **Maintainability**: 1797 lines → 30+ files of 50-150 lines each
2. **Type Safety**: Full TypeScript coverage, catch errors at compile time
3. **Reusability**: DRY principle with shared components
4. **Developer Experience**: 
   - Hot module reloading
   - Fast builds with Vite
   - Clear component boundaries
5. **Testing**: Easy to unit test individual components
6. **State Management**: Centralized, predictable state with Zustand
7. **UI Consistency**: Mantine design system throughout
8. **Performance**: Code splitting, lazy loading potential
9. **Extensibility**: Easy to add new features and components

## Risk Mitigation

- Keep old `index.html` as backup during development
- Test each tab thoroughly before moving to next
- Maintain exact API contract (no backend changes needed)
- Use same styling/colors to maintain visual consistency
- Comprehensive testing before final commit

## Success Criteria

- ✅ All functionality from old UI works in React version
- ✅ No regressions in API integration
- ✅ Improved code organization and maintainability
- ✅ Faster development workflow with HMR
- ✅ Type-safe frontend code
- ✅ Clean component architecture
- ✅ Under 150 lines per component average

## Estimated Time

- Setup: 1 hour
- Core development: 11 hours
- Testing: 2 hours
- **Total: 14 hours**

## Implementation Date

Start: January 30, 2026
Target Completion: Same day (full focus)

---

**Status**: 🚀 Ready to Execute
