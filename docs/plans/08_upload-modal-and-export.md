# Plan 08: Upload Resume Modal & Entity Export

> Add a proper upload modal for resume files and export functionality for all entities (Profile, Resume, Company, Job) in Markdown, PDF, and DOCX formats.
> Execute phases in order. Check off tasks as completed.

---

## Overview

### Goals

1. **Upload Modal**: Replace the bare `<FileButton>` (instant OS file picker) with a modal that explains supported formats before the user selects a file.
2. **Export**: Let users export any entity's markdown content as Markdown (.md), PDF (.pdf), or DOCX (.docx).

### Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Upload modal | **Shared `UploadResumeModal` component** | Used by ProfilePage and ResumesPage with different descriptions; avoids duplication |
| Export route | **`GET /api/export/:entityType/:entityId?format=`** | Single route handles all entities and formats; clean REST pattern |
| Profile export | **`GET /api/export/profile?format=`** | No `:entityId` needed; profile is per-user via auth |
| PDF generation | **Puppeteer** | Already installed (`puppeteer@^24.2.0`); markdown → HTML → PDF via headless Chrome |
| DOCX generation | **`docx` npm package** | Most popular DOCX lib (5k+ GitHub stars); programmatic document creation |
| Markdown → HTML | **`marked`** | Already a backend dependency; consistent with frontend rendering |
| Frontend download | **`fetchBlob` helper in api.ts** | Existing `fetchJson` can't handle binary responses; new helper for file downloads |
| Export UI | **Shared `ExportMenu` component** | Mantine `<Menu>` dropdown with three format options; reused on every detail page |

### Dependencies

**New (backend):**
- `docx` — Programmatic DOCX generation from structured data

**Existing (already installed):**
- `puppeteer` — PDF generation via headless Chrome
- `marked` — Markdown to HTML conversion (backend already has this or can add)

**New (frontend):**
- None — uses existing Mantine components and a new `fetchBlob` helper

---

## Phase 1: Upload Resume Modal

**Goal**: Create a shared modal component that shows format info before file selection. Apply to ProfilePage and ResumesPage.

### 1-1. Create shared `UploadResumeModal` component

- [x] Create `frontend/src/components/shared/UploadResumeModal.tsx`
- [x] Props:
  - `opened: boolean` — controls modal visibility
  - `onClose: () => void` — close handler
  - `onUpload: (file: File) => void` — called when user selects a file
  - `title?: string` — modal title (default: "Upload Resume")
  - `description?: string` — context-specific explanation
  - `loading?: boolean` — shows loading state during upload
- [x] Modal content:
  - Title (from prop or default)
  - Description text (from prop)
  - Supported formats callout: "PDF and DOCX files supported (up to 10MB)"
  - `<FileButton>` styled as a prominent upload button inside the modal
  - Cancel button
- [x] Modal closes automatically when upload starts (parent controls `opened`)

### 1-2. Update ProfilePage

- [x] Add state: `uploadModalOpen`
- [x] Replace `<FileButton>` with a regular `<Button>` that opens the modal
- [x] Render `<UploadResumeModal>` with:
  - `description`: "Upload a PDF or DOCX resume. It will be parsed using AI and merged into your profile as your source of truth."
  - `onUpload`: existing `handleFileUpload` logic
  - `loading`: `enriching` state

### 1-3. Update ResumesPage

- [x] Add state: `uploadModalOpen`
- [x] Replace `<FileButton>` with a regular `<Button>` that opens the modal
- [x] Render `<UploadResumeModal>` with:
  - `description`: "Upload a PDF or DOCX resume. It will be parsed using AI and saved as a new resume in your collection."
  - `onUpload`: existing `handleUploadResume` logic

### 1-4. Verify

- [x] Profile upload modal opens, shows info, accepts file, enriches profile
- [x] Resumes upload modal opens, shows info, accepts file, creates resume

---

## Phase 2: Export — Backend

**Goal**: Create a backend export route that converts entity markdown content to the requested format.

### 2-1. Install DOCX dependency

- [x] `cd backend && npm install docx`
- [x] Verify `marked` is available in backend (install if needed: `npm install marked`)
- [x] Update `docs/tech-stack.md` with new dependency

### 2-2. Create export route module

- [x] Create `backend/src/routes/export.routes.ts`
- [x] Register in `backend/src/web/server.ts`: `app.use("/api/export", exportRoutes)`
- [x] All routes require `authMiddleware`

### 2-3. Implement `GET /api/export/profile`

- [x] Query param: `format` (required: `markdown` | `pdf` | `docx`)
- [x] Fetch profile `content` and `display_name` from DB for authenticated user
- [x] Route to format handler based on `format` param
- [x] Set appropriate `Content-Type` and `Content-Disposition` headers

### 2-4. Implement `GET /api/export/:entityType/:entityId`

- [x] Validate `entityType` is one of: `resume`, `company`, `job`
- [x] Validate `entityId` is a valid UUID
- [x] Fetch entity from DB, verify `user_id` matches authenticated user
- [x] Extract `content` (markdown) and a display name (title/name)
- [x] Route to format handler based on `format` param

### 2-5. Implement Markdown format handler

- [x] Return raw markdown as `text/markdown`
- [x] `Content-Disposition: attachment; filename="<name>.md"`
- [x] Simplest handler — just streams the content

### 2-6. Implement PDF format handler

- [x] Convert markdown to HTML using `marked`
- [x] Wrap HTML in a basic document template with clean typography CSS
- [x] Launch Puppeteer, render HTML, generate PDF buffer
- [x] Return as `application/pdf`
- [x] `Content-Disposition: attachment; filename="<name>.pdf"`
- [x] Consider: reuse a single browser instance (launch on server start, close on shutdown) to avoid cold-start cost per export

### 2-7. Implement DOCX format handler

- [x] Convert markdown to DOCX using `backend/src/utils/markdown-to-docx.ts` (headings + paragraphs from markdown)
- [x] Use `docx` library to build a Document with title and sections
- [x] Generate buffer via `Packer.toBuffer(doc)`
- [x] Return as `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- [x] `Content-Disposition: attachment; filename="<name>.docx"`

### 2-8. Verify backend

- [ ] Test each format via curl or Postman for each entity type
- [ ] Verify auth is required
- [ ] Verify 404 for non-existent entities
- [ ] Verify PDF renders cleanly
- [ ] Verify DOCX opens in Word/Google Docs

---

## Phase 3: Export — Frontend

**Goal**: Add export UI to all detail pages and the profile page. Create shared components and API helper.

### 3-1. Add `fetchBlob` helper to `api.ts`

- [x] New function: `fetchBlob(url: string, filename: string): Promise<void>`
- [ ] Similar to `fetchJson` but:
  - Gets auth headers
  - Calls `fetch` with full URL
  - On success, creates a `Blob` from response
  - Creates a temporary `<a>` element, sets `href` to `URL.createObjectURL(blob)`, sets `download` to `filename`
  - Clicks the link to trigger download
  - Cleans up the object URL

### 3-2. Add export API functions to `api.ts`

- [x] `exportEntity(entityType: string, entityId: string, format: string, entityName: string): Promise<void>`
  - Builds URL: `/api/export/${entityType}/${entityId}?format=${format}`
  - Calls `fetchBlob` with appropriate filename
- [x] `exportProfile(format: string): Promise<void>`
  - Builds URL: `/api/export/profile?format=${format}`
  - Calls `fetchBlob`

### 3-3. Create shared `ExportMenu` component

- [x] Create `frontend/src/components/shared/ExportMenu.tsx`
- [x] Props:
  - `entityType: "profile" | "resume" | "company" | "job"`
  - `entityId?: string` (omitted for profile)
  - `entityName: string` (used for filename)
- [x] Renders a Mantine `<Menu>` with a trigger `<Button>`:
  - Icon: `IconDownload`
  - Label: "Export"
  - Variant: `light`
- [x] Three menu items:
  - "Markdown (.md)" → calls export with `format=markdown`
  - "PDF (.pdf)" → calls export with `format=pdf`
  - "Word (.docx)" → calls export with `format=docx`
- [x] Shows notification on success/error
- [x] Optional loading state while export is in progress

### 3-4. Add `ExportMenu` to ProfilePage

- [x] Place in the header `<Group>` next to the upload button
- [x] `entityType="profile"`, `entityName={profile.display_name}`

### 3-5. Add `ExportMenu` to ResumeDetailPage

- [x] Place in the header `<Group>` next to Save/Delete buttons
- [x] `entityType="resume"`, `entityId={resumeId}`, `entityName={title}`

### 3-6. Add `ExportMenu` to CompanyDetailPage

- [x] Place in the header `<Group>` next to Save button
- [x] `entityType="company"`, `entityId={companyId}`, `entityName={name}`

### 3-7. Add `ExportMenu` to JobDetailPage

- [x] Place in the header `<Group>` next to Save button
- [x] `entityType="job"`, `entityId={jobId}`, `entityName={title}`

### 3-8. Verify frontend

- [ ] Export menu appears on all four detail/profile pages
- [ ] Each format triggers download with correct filename and extension
- [ ] PDF opens in a reader, DOCX opens in Word/Docs, MD opens in any text editor
- [ ] Error notification shows if export fails

---

## Phase 4: Documentation & Cleanup

### 4-1. Update documentation

- [x] Update `docs/tech-stack.md` — add `docx` and `puppeteer` under Backend dependencies
- [x] Update `docs/api-refactoring-summary.md` — add Export Routes section
- [ ] Update `docs/architecture.md` if needed — mention export capability

### 4-2. Update activity logging

- [x] Log export actions to activity log (action: "export", entity_type, entity_id, details: { format })

---

## File Summary

### New Files

| File | Description |
|------|-------------|
| `frontend/src/components/shared/UploadResumeModal.tsx` | Shared upload modal with format info |
| `frontend/src/components/shared/ExportMenu.tsx` | Shared export dropdown menu |
| `backend/src/routes/export.routes.ts` | Export endpoint for all entity types |

### Modified Files

| File | Changes |
|------|---------|
| `frontend/src/pages/ProfilePage.tsx` | Use UploadResumeModal, add ExportMenu |
| `frontend/src/pages/ResumesPage.tsx` | Use UploadResumeModal |
| `frontend/src/pages/ResumeDetailPage.tsx` | Add ExportMenu |
| `frontend/src/pages/CompanyDetailPage.tsx` | Add ExportMenu |
| `frontend/src/pages/JobDetailPage.tsx` | Add ExportMenu |
| `frontend/src/services/api.ts` | Add fetchBlob, exportEntity, exportProfile |
| `backend/src/web/server.ts` | Register export routes |
| `backend/package.json` | Add `docx` dependency |
| `docs/tech-stack.md` | Document new dependency |
| `docs/api-refactoring-summary.md` | Document export endpoints |

---

## Status: Complete

Implementation done. Manual verification (2-8, 3-8) and optional architecture doc update remain.
