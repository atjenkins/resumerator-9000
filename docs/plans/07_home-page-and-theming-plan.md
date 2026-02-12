# Home Page & Theming System Plan

> Add a welcoming Home page and a centralized personality-driven theming system.
> Execute phases in order. Check off tasks as completed.

---

## Overview

### Goals

1. **Home Page**: A fun, educational landing page that orients users on what the platform does and how to use it. Dashboard remains separate for stats/quicklinks.
2. **Theming System**: A centralized, personality-driven theme engine that controls colors, fonts, flavor text, and eventually SVGs/component variants. Users select from preset themes; their choice persists in the database.

### Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State management | **Zustand store** | Already a dependency; accessible outside React; selective subscriptions; `zustand/persist` for instant hydration |
| Theme definition | **Preset objects** (not user-customizable) | DB stores a simple string ID; all config lives in frontend preset files |
| Persistence | **`theme_id` column on `profiles`** + localStorage cache | Syncs across devices via DB; localStorage prevents flash on load |
| Theme scope | **Personality system** (not just colors) | Controls Mantine theme, header gradient, silly messages, and is extensible to SVGs/component variants |

---

## Phase 2a: Home Page

**Goal**: Create a welcoming Home page that explains the platform. Dashboard stays as a separate page for stats/quicklinks.

### 2a-1. Create `HomePage.tsx`

- [ ] Create `frontend/src/pages/HomePage.tsx`
- [ ] **Hero Section**:
  - Fun welcome headline (e.g., "Welcome to Resumerator 9000")
  - Cheeky tagline (e.g., "Your resume's new best friend. Or at least its most honest critic.")
  - Two CTA buttons: "Get Started" → Profile, "View Dashboard" → Dashboard
- [ ] **How It Works** section:
  - 4-step visual walkthrough using Mantine `Timeline` or `Stepper` (display-only):
    1. **Build Your Profile** — Paste or upload your master resume. This is your professional baseline.
    2. **Track Your Targets** — Add companies and job postings you're interested in.
    3. **Analyze** — Get AI-powered feedback on your resume, optionally against a specific job.
    4. **Generate** — Create tailored resumes optimized for specific positions.
  - Each step has an icon, title, and 1-2 sentence description
- [ ] **Feature Cards** section:
  - Grid of cards (one per major section), each with:
    - Icon (from `@tabler/icons-react`, matching sidebar icons)
    - Section name
    - Cheeky 1-liner description
    - Click navigates to that section
  - Sections to cover:
    | Section | Icon | Description idea |
    |---------|------|-----------------|
    | Profile | `IconUser` | "Your professional identity. Think of it as the source code for all your resumes." |
    | Resumes | `IconFileText` | "Where your resumes live, breathe, and occasionally get a glow-up." |
    | Companies | `IconBriefcase` | "Keep tabs on the companies you're wooing. They don't need to know yet." |
    | Jobs | `IconClipboard` | "Track every job posting. Because bookmarking 47 browser tabs isn't a strategy." |
    | Analyze | `IconReportAnalytics` | "Let AI judge your resume so humans don't have to. Brutally honest, but fair." |
    | Generate | `IconSparkles` | "AI-crafted resumes tailored to specific jobs. Like a bespoke suit, but for words." |
    | History | `IconHistory` | "Everything you've done, logged and timestamped. Your alibi, if you will." |
- [ ] Use Mantine components throughout: `Title`, `Text`, `Card`, `Grid`, `Group`, `Stack`, `ThemeIcon`, `Timeline`/`Stepper`
- [ ] Keep the same layout for new and returning users (no conditional content)

### 2a-2. Routing & Navigation

- [ ] **App.tsx**: Import `HomePage`, add `case "home"` to `renderPage()`, set default `activePage` to `"home"` (was `"dashboard"`)
- [ ] **Sidebar.tsx**: Add "Home" as the first nav item (`{ value: "home", label: "Home", icon: IconHome }`), keep "Dashboard" as second item
- [ ] Import `IconHome` from `@tabler/icons-react` in Sidebar

### Files touched (3):

- `frontend/src/pages/HomePage.tsx` (new)
- `frontend/src/App.tsx`
- `frontend/src/components/layout/Sidebar.tsx`

---

## Phase 2b: Theme Infrastructure

**Goal**: Create the `AppTheme` type, Zustand store, and wire `MantineProvider` to the store. No visual changes yet — just the plumbing.

### 2b-1. Define `AppTheme` type

- [ ] Create `frontend/src/theme/types.ts`
- [ ] Define the `AppTheme` interface:

```typescript
import { MantineThemeOverride } from "@mantine/core";

export interface AppTheme {
  // Identity
  id: string;           // "default" | "robot" | "designer" | "fairies"
  name: string;         // Display name
  description: string;  // Short tagline for the theme picker

  // Mantine theme override (primaryColor, colors, fontFamily, defaultRadius, etc.)
  mantineTheme: MantineThemeOverride;

  // Custom styling tokens (beyond Mantine's scope)
  headerGradient: string;   // CSS gradient for the app header

  // Personality text
  sillyMessages: {
    analyze: string[];
    generate: string[];
    enrich: string[];
  };

  // Home page flavor text
  tagline: string;          // Hero subtitle on home page
  featureDescriptions: {    // Per-section descriptions for home page cards
    profile: string;
    resumes: string;
    companies: string;
    jobs: string;
    analyze: string;
    generate: string;
    history: string;
  };

  // Future expansion (add when needed, won't break existing code)
  // illustrations?: Record<string, React.ComponentType>;
  // loadingVariant?: "bar" | "dots" | "orbit" | "sparkle";
  // emptyStateStyle?: "minimal" | "illustrated";
}
```

### 2b-2. Create default theme preset

- [ ] Create `frontend/src/theme/themes/default.ts`
- [ ] Extract the current theme values from `theme.ts` into an `AppTheme` object
- [ ] Move the current `SILLY_MESSAGES` from `AIProgressBar.tsx` into this preset
- [ ] Add `tagline` and `featureDescriptions` from the Home page copy (Phase 2a)
- [ ] Add `headerGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"` (current Header value)

### 2b-3. Create theme registry

- [ ] Create `frontend/src/theme/themes/index.ts`
- [ ] Export a `Record<string, AppTheme>` registry mapping theme IDs to theme objects
- [ ] For now, only contains `default`; other themes added in Phase 2c
- [ ] Export a `getTheme(id: string): AppTheme` helper that falls back to `default` if ID is unknown

### 2b-4. Create Zustand theme store

- [ ] Create `frontend/src/theme/useThemeStore.ts`
- [ ] Use `zustand` with `zustand/persist` middleware (localStorage)
- [ ] Store shape:

```typescript
interface ThemeState {
  themeId: string;
  setThemeId: (id: string) => void;
}
```

- [ ] The store persists only the `themeId` string
- [ ] Consumers derive the full `AppTheme` via `getTheme(themeId)` (don't store the full object — keep the store thin)

### 2b-5. Wire `MantineProvider` to the store

- [ ] **App.tsx**: Replace static `theme` import with dynamic theme from store:

```typescript
const themeId = useThemeStore((s) => s.themeId);
const appTheme = getTheme(themeId);
// ...
<MantineProvider theme={appTheme.mantineTheme}>
```

- [ ] Remove the old `import { theme } from "./theme/theme"` (or keep `theme.ts` as a re-export of default for backwards compat)

### 2b-6. Wire Header gradient to the store

- [ ] **Header.tsx**: Replace hardcoded gradient with:

```typescript
const themeId = useThemeStore((s) => s.themeId);
const appTheme = getTheme(themeId);
// ...
background: appTheme.headerGradient,
```

### 2b-7. Wire AIProgressBar to the store

- [ ] **AIProgressBar.tsx**: Remove the hardcoded `SILLY_MESSAGES` constant
- [ ] Read messages from the theme:

```typescript
const themeId = useThemeStore((s) => s.themeId);
const appTheme = getTheme(themeId);
const messages = appTheme.sillyMessages[operationType];
```

### 2b-8. Wire HomePage to the store (if Phase 2a is complete)

- [ ] **HomePage.tsx**: Read `tagline` and `featureDescriptions` from the theme instead of hardcoding them

### Files touched (6-7):

- `frontend/src/theme/types.ts` (new)
- `frontend/src/theme/themes/default.ts` (new)
- `frontend/src/theme/themes/index.ts` (new)
- `frontend/src/theme/useThemeStore.ts` (new)
- `frontend/src/App.tsx`
- `frontend/src/components/layout/Header.tsx`
- `frontend/src/components/shared/AIProgressBar.tsx`

---

## Phase 2c: Theme Presets

**Goal**: Define 3 additional theme presets with unique personalities. Replace remaining hardcoded colors.

### 2c-1. Technical Robot theme

- [ ] Create `frontend/src/theme/themes/robot.ts`
- [ ] Color palette: Cyan/Teal primary (`#0891b2` family)
- [ ] Header gradient: `linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)`
- [ ] Font family: Add a monospace accent (e.g., `"JetBrains Mono", "Fira Code", monospace` for code feel, or keep system font with monospace taglines)
- [ ] Silly messages — robotic/technical tone:
  - analyze: "Running diagnostic protocols...", "Scanning resume firmware for bugs...", "Compiling career metrics...", "Executing talent.exe...", "Querying the professional database...", "Performing binary analysis of qualifications...", "Defragmenting your experience timeline...", "Running checksum on achievements...", "Initializing neural resume parser...", "Benchmarking against industry standards..."
  - generate: "Compiling optimized resume binary...", "Allocating memory for achievements...", "Building resume from source...", "Linking professional libraries...", "Deploying career firmware v2.0...", "Assembling instruction set for recruiters...", "Optimizing resume throughput...", "Generating human-readable output...", "Running career compiler...", "Flashing updated resume to disk..."
  - enrich: "Downloading professional data packets...", "Parsing career telemetry...", "Indexing skill modules...", "Mapping experience nodes...", "Syncing professional firmware...", "Loading career drivers...", "Calibrating experience sensors...", "Updating skill repository..."
- [ ] Tagline: "Resume optimization through superior engineering."
- [ ] Feature descriptions: Technical/robotic tone for each section

### 2c-2. Designer theme

- [ ] Create `frontend/src/theme/themes/designer.ts`
- [ ] Color palette: Rose/Pink primary (`#e64980` family)
- [ ] Header gradient: `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`
- [ ] Silly messages — artsy/creative tone:
  - analyze: "Critiquing your professional canvas...", "Studying the composition of your experience...", "Evaluating the typography of your career...", "Assessing the negative space in your resume...", "Reviewing your professional color palette...", "Measuring the visual weight of your achievements...", "Checking the kerning on your career narrative...", "Examining the hierarchy of your skills...", "Evaluating flow and rhythm...", "Curating feedback with care..."
  - generate: "Designing your professional masterpiece...", "Selecting the perfect typeface for your career...", "Composing a visual narrative...", "Arranging elements on the career canvas...", "Applying the golden ratio to your achievements...", "Whitespace-optimizing your experience...", "Art-directing your professional story...", "Sketching the perfect layout...", "Adding finishing touches...", "Polishing your portfolio piece..."
  - enrich: "Sketching your professional portrait...", "Mixing your career color palette...", "Drafting your experience wireframe...", "Styling your professional mood board...", "Curating your skill gallery...", "Illustrating your career arc...", "Framing your achievements...", "Composing your creative brief..."
- [ ] Tagline: "Crafting careers with elegance and intention."
- [ ] Feature descriptions: Artsy/design tone for each section

### 2c-3. Fairies theme

- [ ] Create `frontend/src/theme/themes/fairies.ts`
- [ ] Color palette: Lavender/Violet primary (`#9775fa` family) with gold accents
- [ ] Header gradient: `linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)`
- [ ] Silly messages — whimsical/magical tone:
  - analyze: "Consulting the career fairy council...", "Reading your resume's tea leaves...", "Casting a spell of professional insight...", "Summoning the feedback sprites...", "Gazing into the crystal ball of employment...", "Asking the woodland creatures for their opinion...", "Sprinkling analysis dust...", "The resume gnomes are reviewing...", "Enchanting your qualifications...", "Brewing a potion of career wisdom..."
  - generate: "Weaving your career tapestry...", "The resume fairies are hard at work...", "Enchanting words onto parchment...", "Casting a tailoring spell...", "Gathering moonlit achievements...", "The pixies are polishing your prose...", "Spinning career gold from experience straw...", "Conjuring the perfect resume...", "Summoning the muse of employment...", "Adding a sprinkle of fairy dust..."
  - enrich: "The forest spirits are reading your story...", "Gathering dewdrops of experience...", "The wise owl is organizing your skills...", "Planting seeds of professional growth...", "Weaving your experience into a magic carpet...", "The enchanted quill is taking notes...", "Bottling your career essence...", "Tending the garden of your achievements..."
- [ ] Tagline: "A sprinkle of magic for your career journey."
- [ ] Feature descriptions: Whimsical/magical tone for each section

### 2c-4. Register all themes

- [ ] Update `frontend/src/theme/themes/index.ts` to import and register `robot`, `designer`, `fairies`

### 2c-5. Replace remaining hardcoded colors

Audit and replace all hardcoded hex colors with theme-aware values:

- [ ] **MarkdownEditor.tsx**:
  - `#dee2e6` borders → use `theme.colors.gray[3]` via `useMantineTheme()`
  - `#fff` background → use `theme.white`
  - `#868e96` dimmed text → use `theme.colors.gray[6]`
- [ ] **GeneratePage.tsx**:
  - Same `#dee2e6` / `#fff` pattern → theme-aware values
- [ ] **Any other files** with hardcoded colors found during implementation

### Files touched (5-6):

- `frontend/src/theme/themes/robot.ts` (new)
- `frontend/src/theme/themes/designer.ts` (new)
- `frontend/src/theme/themes/fairies.ts` (new)
- `frontend/src/theme/themes/index.ts`
- `frontend/src/components/shared/MarkdownEditor.tsx`
- `frontend/src/pages/GeneratePage.tsx`

---

## Phase 2d: Theme Picker UI

**Goal**: Let users switch themes from the UI.

### 2d-1. Create Theme Picker component

- [ ] Create `frontend/src/components/shared/ThemePicker.tsx`
- [ ] Display all available themes as visual cards/swatches:
  - Show theme name and description
  - Show a color preview (gradient swatch or color dots)
  - Highlight the currently selected theme
  - Click to select
- [ ] Use the Zustand store's `setThemeId` on selection
- [ ] Use Mantine `Modal` or `Drawer` as the container

### 2d-2. Add Theme Picker trigger to Header

- [ ] **Header.tsx**: Add a theme/palette icon button (e.g., `IconPalette`) next to the user menu
- [ ] Clicking opens the Theme Picker modal/drawer
- [ ] Alternatively (or additionally): Add a "Theme" option inside the user dropdown menu

### Files touched (2):

- `frontend/src/components/shared/ThemePicker.tsx` (new)
- `frontend/src/components/layout/Header.tsx`

---

## Phase 2e: Theme Persistence (Database)

**Goal**: Save theme preference to the database so it syncs across devices.

### 2e-1. Database migration

- [ ] Create `backend/database/migrations/005_add_theme_to_profiles.sql`:

```sql
-- Add theme preference to profiles
ALTER TABLE profiles ADD COLUMN theme_id TEXT NOT NULL DEFAULT 'default';
```

No constraints (theme validation lives in frontend — if an unknown ID is stored, frontend falls back to `default`).

### 2e-2. Backend route

- [ ] **profile.routes.ts**: The existing `PUT /api/profile` already updates the profile — verify that `theme_id` can be included in the update payload
- [ ] If the update route uses explicit column whitelisting, add `theme_id` to the allowed fields
- [ ] No new route needed — just ensure `theme_id` flows through the existing update

### 2e-3. Frontend types

- [ ] **supabase.ts**: Add `theme_id: string` to the `Profile` interface
- [ ] **api.ts**: Ensure profile update function passes `theme_id` if present

### 2e-4. Sync store with profile

- [ ] **AuthContext.tsx**: After `fetchProfile()` resolves, sync the theme store:

```typescript
if (data?.theme_id) {
  useThemeStore.getState().setThemeId(data.theme_id);
}
```

- [ ] **ThemePicker.tsx**: On theme selection, also call the profile update API to persist to DB:

```typescript
const handleSelect = async (id: string) => {
  setThemeId(id);  // Zustand (instant UI update)
  await updateProfile({ theme_id: id });  // DB persistence (fire-and-forget)
};
```

### 2e-5. Update generated types

- [ ] After running the migration, regenerate types: `npm run db:types`
- [ ] Verify `theme_id` appears in the generated `profiles` type

### 2e-6. Update documentation

- [ ] **database/README.md**: Document migration `005`
- [ ] **docs/tech-stack.md**: Add Zustand theme store to "Frontend Patterns", note theme persistence pattern
- [ ] **docs/architecture.md**: Add theming system to architecture overview

### Files touched (5-7):

- `backend/database/migrations/005_add_theme_to_profiles.sql` (new)
- `backend/src/routes/profile.routes.ts` (verify/update)
- `frontend/src/services/supabase.ts`
- `frontend/src/services/api.ts` (if needed)
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/components/shared/ThemePicker.tsx`
- Documentation files

---

## Summary

| Phase | Description | Scope | New Files | Modified Files |
|-------|-------------|-------|-----------|----------------|
| **2a** | Home Page | Frontend | 1 | 2 |
| **2b** | Theme Infrastructure | Frontend | 4 | 3 |
| **2c** | Theme Presets | Frontend | 3 | 3 |
| **2d** | Theme Picker UI | Frontend | 1 | 1 |
| **2e** | Theme Persistence | Full Stack | 1 | 5-7 |
| **Total** | | | **10** | **~14** |

### Execution Notes

- Phases 2a and 2b can be done in parallel (they're independent)
- Phase 2c depends on 2b (needs the theme type and registry)
- Phase 2d depends on 2b+2c (needs themes to exist to pick from)
- Phase 2e depends on 2d (needs the picker to wire persistence into)
- All phases 2a-2d are frontend-only — fast iteration, no backend deploys needed
- Phase 2e is the only one touching the database and backend

### Future Extensibility

The `AppTheme` type is designed to grow. Future additions (no structural changes needed):

- `illustrations: Record<string, React.ComponentType>` — themed SVGs for empty states, hero sections
- `loadingVariant: "bar" | "dots" | "orbit" | "sparkle"` — different loading animations per theme
- `emptyStateStyle: "minimal" | "illustrated"` — how empty lists look
- `cardStyle: "flat" | "elevated" | "bordered"` — component variant selection
- `animationSpeed: "normal" | "playful" | "calm"` — animation intensity
