# Plan 09: PDF Export Templates & Page Length Control

> Add selectable CSS templates for PDF/DOCX export and a target page length setting (1-page, 2-page, unlimited). This is an optional enhancement — the app works without it.

---

## Overview

### Problem

The current PDF export uses a single hardcoded CSS stylesheet. Markdown captures structure but not presentation, so users have no control over fonts, spacing, layout, or page length. For resumes specifically, formatting and page count matter a lot.

### Goals

1. **Templates**: Let users choose from 3-5 CSS templates when exporting to PDF (e.g., "Classic," "Modern," "Compact").
2. **Page Length**: Let users set a target page length (1 page, 2 pages, unlimited) which adjusts font size, spacing, and margins accordingly.
3. **Defaults**: Store the user's preferred template and page length on their profile so they don't have to pick every time.
4. **DOCX parity**: Apply equivalent styling differences to DOCX exports where feasible (font, spacing, margins). Full visual parity with PDF is not a goal.

### Non-Goals

- Full WYSIWYG editor
- User-authored custom CSS
- Per-entity template selection (same template applies to all exports for now)

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Template storage | CSS files in `backend/src/templates/` | Simple, versionable, no DB needed for template content |
| Template selection | Query param `&template=classic` | Keeps export stateless; frontend sends user's preference |
| Page length | Query param `&pageLength=1` | Same pattern; `1`, `2`, or `unlimited` |
| User defaults | New columns on `profiles` table | `export_template` and `export_page_length` — simple, no new table |
| DOCX styling | Translate template settings to `docx` lib options | Best-effort mapping of font family, size, spacing |

### API Changes

**Modified endpoints:**
```
GET /api/export/profile?format=pdf&template=classic&pageLength=1
GET /api/export/:entityType/:entityId?format=pdf&template=modern&pageLength=2
```

New query params (all optional, fall back to defaults):
- `template` — one of: `classic`, `modern`, `compact`, `minimal`, `executive`
- `pageLength` — one of: `1`, `2`, `unlimited`

**New endpoint:**
```
GET /api/export/templates
```
Returns the list of available templates with name, description, and a preview thumbnail URL (or just metadata for v1).

**Modified endpoint:**
```
PATCH /api/profile
```
Body now also accepts optional `export_template` and `export_page_length` fields.

---

## Template Design

### Where to Get Starter Templates

There are several good approaches for sourcing the initial CSS:

1. **AI-generated** — The most practical for this project. Describe the desired look (e.g., "professional single-column resume with serif headings and sans-serif body, tight spacing") and have Claude/GPT generate the full CSS. Iterate on the output. This is how most of these will likely be built.

2. **Open-source resume CSS** — Good starting points to adapt:
   - [**Universal Resume**](https://github.com/WebPraktworking/universal-resume) — Tailwind-based, multiple page formats
   - [**Resumed**](https://github.com/rbardini/resumed) — JSON Resume theme ecosystem, many CSS themes
   - [**JSON Resume themes**](https://jsonresume.org/themes/) — Browse `jsonresume-theme-*` on npm; each has a CSS file you can extract
   - [**Best-Resume-Ever**](https://github.com/salomonelli/best-resume-ever) — Vue-based but the CSS/layout ideas are portable
   - [**Reactive Resume**](https://github.com/AmruthPillworking/Reactive-Resume) — Open-source resume builder with multiple templates; CSS is extractable

3. **Commercial inspiration** — Look at the output from FlowCV, Canva, or Overleaf resume templates for layout ideas, then build the CSS from scratch.

**Recommendation**: Use AI to generate 3-5 templates, referencing open-source examples for layout inspiration. Each template is just a CSS string — easy to tweak and test.

### Proposed Templates

| Template | Style | Description |
|----------|-------|-------------|
| `classic` | Traditional | Serif headings (Georgia), sans-serif body (system-ui). Generous margins. Conservative look. |
| `modern` | Clean | All sans-serif (Inter/system-ui). Subtle color accents on headings. Tight but readable spacing. |
| `compact` | Dense | Smaller font size (10pt base), reduced margins and spacing. Optimized for fitting content on fewer pages. |
| `minimal` | Simple | No borders or decorations. Maximum whitespace. Monochrome. Relies on typography hierarchy alone. |
| `executive` | Professional | Two-tone header area, slightly larger name. Suitable for senior roles. |

### Page Length Strategy

Page length isn't a strict enforcement — you can't guarantee content fits on exactly 1 page. Instead, the approach is to adjust CSS variables that influence density:

| Setting | Font Size | Line Height | Margin | Section Spacing | H1 Size |
|---------|-----------|-------------|--------|-----------------|---------|
| 1 page | 9.5pt | 1.25 | 12mm | 0.3rem | 13pt |
| 2 pages | 10.5pt | 1.4 | 16mm | 0.5rem | 15pt |
| Unlimited | 11pt | 1.5 | 20mm | 0.75rem | 16pt |

These values are combined with the template CSS via CSS custom properties:

```css
:root {
  --base-font-size: 10.5pt;
  --line-height: 1.4;
  --page-margin: 16mm;
  --section-spacing: 0.5rem;
  --h1-size: 15pt;
}
```

Each template uses these variables, so page length and template are independent axes.

---

## Dependencies

**New:** None — this uses existing `puppeteer`, `docx`, and `marked`.

**Optional:** If we want to use the `Inter` font in templates, we could embed it via a Google Fonts `<link>` in the HTML or bundle the woff2 file. Not required for v1 — `system-ui` works fine.

---

## Phases

### Phase 1: Backend — Template Infrastructure

- [ ] Create `backend/src/templates/` directory
- [ ] Create CSS template files: `classic.css`, `modern.css`, `compact.css`, `minimal.css`, `executive.css`
  - Each template should use CSS custom properties for page-length-adjustable values
  - AI can generate these — describe the look you want and iterate
- [ ] Create `backend/src/templates/index.ts` — registry that maps template name → CSS string and includes metadata (display name, description)
- [ ] Create `backend/src/templates/page-length.ts` — maps `1` / `2` / `unlimited` to CSS variable overrides
- [ ] Update `sendPdf` in `export.routes.ts` to accept `templateCss` and `pageLengthCss` params and inject them into the HTML
- [ ] Update `sendDocx` / `markdownToDocx` to accept a style config object (font family, font size, line height, margins) derived from the template + page length settings
- [ ] Add `GET /api/export/templates` endpoint returning `{ templates: [{ id, name, description }] }`
- [ ] Update both export route handlers to read `template` and `pageLength` query params, look up CSS, and pass to renderers
- [ ] Validate `template` and `pageLength` params (fall back to `classic` and `unlimited` if missing/invalid)

### Phase 2: Database — User Preferences

- [ ] Add columns to `profiles` table:
  - `export_template TEXT DEFAULT 'classic'`
  - `export_page_length TEXT DEFAULT 'unlimited'`
- [ ] Update profile PATCH handler to accept and persist these fields
- [ ] Update profile GET handler to return these fields
- [ ] Update export route handlers to fall back to user's saved preference if query params are not provided

### Phase 3: Frontend — Export Settings UI

- [ ] Update `ExportMenu` component:
  - Add a template selector (Mantine `Select` or `SegmentedControl`) above the format buttons
  - Add a page length selector (`1 page`, `2 pages`, `Unlimited`)
  - Pass selected `template` and `pageLength` to the export API calls
  - Pre-populate selectors from user's saved preferences (fetched from profile)
- [ ] Update `exportProfile` and `exportEntity` in `api.ts` to accept and pass `template` and `pageLength` query params
- [ ] Add an "Export Settings" section to the profile/settings area where users can set their default template and page length
  - This writes to the profile via the existing PATCH endpoint
- [ ] Consider showing a small template preview (could be a static thumbnail image per template, or just the name + description for v1)

### Phase 4: Polish & Documentation

- [ ] Test all 5 templates × 3 page lengths × 3 formats (PDF, DOCX, Markdown) — Markdown is unaffected by template/length
- [ ] Ensure templates look good with varying content lengths (short profile vs. long resume)
- [ ] Update `docs/api-refactoring-summary.md` with new query params and endpoint
- [ ] Update `docs/tech-stack.md` if any new packages are added
- [ ] Update plan status

---

## Implementation Notes

### CSS Template File Structure

Each template file should follow this pattern:

```css
/* template: classic */
/* description: Traditional resume style with serif headings */

:root {
  /* These are overridden by page-length settings */
  --base-font-size: 11pt;
  --line-height: 1.5;
  --page-margin: 20mm;
  --section-spacing: 0.75rem;
  --h1-size: 16pt;
  --h2-size: 13pt;
  --h3-size: 11.5pt;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: var(--base-font-size);
  line-height: var(--line-height);
  color: #333;
  max-width: 100%;
  margin: 0;
  padding: 0;
}

h1 {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: var(--h1-size);
  margin-top: var(--section-spacing);
  margin-bottom: 0.25rem;
  color: #1a1a1a;
}

/* ... etc ... */
```

### Page Length CSS Override

```css
/* Generated and injected after the template CSS */
:root {
  --base-font-size: 9.5pt;   /* tighter for 1-page */
  --line-height: 1.25;
  --section-spacing: 0.3rem;
  --h1-size: 13pt;
  --h2-size: 11pt;
  --h3-size: 10pt;
}
```

### DOCX Template Mapping

The `docx` library doesn't support CSS, so templates map to a config object:

```typescript
interface DocxStyleConfig {
  baseFontSize: number;    // in half-points (22 = 11pt)
  headingFontSize: number;
  fontFamily: string;
  lineSpacing: number;     // in twips (240 = single)
  paragraphSpacing: number;
}
```

This is a best-effort translation — DOCX will look similar but not identical to PDF. That's acceptable.

### Puppeteer Page Margin from Page Length

The `pageLength` also adjusts Puppeteer's `margin` option:

```typescript
const margins = {
  "1":         { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
  "2":         { top: "16mm", right: "16mm", bottom: "16mm", left: "16mm" },
  "unlimited": { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
};
```

---

## Effort Estimate

| Phase | Effort | Notes |
|-------|--------|-------|
| Phase 1 | Medium | Most work is in designing the CSS templates themselves |
| Phase 2 | Small | Two columns + minor handler updates |
| Phase 3 | Medium | ExportMenu redesign + settings UI |
| Phase 4 | Small | Testing and docs |

**Total: ~1-2 sessions**

---

## Status: Not Started
