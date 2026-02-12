# Plan 10: Ko-fi Support Integration

> Add Ko-fi "support me" links and assets throughout the app in a tasteful, non-intrusive way using Ko-fi's official brand assets and widgets.

---

## Overview

### Goals

1. Place Ko-fi support links in 4 locations: sidebar, mobile drawer, dashboard, and home page footer
2. Use Ko-fi's official brand assets (cup logo, button images) for a polished, recognizable look
3. Keep placements subtle — never interrupt active workflows (editing, analyzing, generating)

### Non-Goals

- Ko-fi floating chat widget (overlays the UI, can't be controlled per-page, uses `document.write`)
- Inline donation panel / iframe embed (too heavy for a sidebar)
- Any kind of popup, banner, or interstitial

---

## Ko-fi Assets & Integration Options

### Official Brand Asset Pack

Download from: `https://storage.ko-fi.com/cdn/brandasset/v2/kofi_brandasset.zip`

The ZIP contains:
- **Button images** (PNG): `support_me_on_kofi_dark.png`, `_blue.png`, `_red.png`, `_beige.png` — full-width rectangular buttons
- **Badge buttons** (PNG): `support_me_on_kofi_badge_dark.png`, `_blue.png`, etc. — compact badge-style
- **Ko-fi logo** (PNG): The cup + wordmark
- **Favicon** (PNG): Just the cup icon

### CDN-Hosted Button Images

Ko-fi hosts their button images on CDN. These can be used directly as `<img>` sources:
- `https://cdn.prod.website-files.com/5c14e387dab576fe667689cf/670f5a02fcf48af59c591185_support_me_on_kofi_dark.png`
- `https://cdn.prod.website-files.com/5c14e387dab576fe667689cf/670f5a01c01ea9191809398c_support_me_on_kofi_blue.png`
- `https://cdn.prod.website-files.com/5c14e387dab576fe667689cf/670f5a01cf2da94a032117b9_support_me_on_kofi_red.png`
- `https://cdn.prod.website-files.com/5c14e387dab576fe667689cf/670f5a0171bfb928b21a7e00_support_me_on_kofi_beige.png`

### Brand Colors

| Color | Hex | Use |
|-------|-----|-----|
| Ko-fi Purple | `#C19BFF` | Primary brand color |
| Ko-fi Orange | `#FF6433` | Accent / CTA |
| Ko-fi Blue | `#72A5F2` | Button variant |
| Ko-fi Beige | `#E3D6C6` | Warm accent |
| Dark | `#202020` | Dark button bg |

### Integration Approach

Use **static image assets** (downloaded into `frontend/public/kofi/`) wrapped in `<a>` links to the Ko-fi page. This is:
- Zero external scripts (no `document.write`, no page load impact)
- Works in React without any special lifecycle handling
- Looks exactly like Ko-fi's official buttons
- Respects dark/light mode when using the right button variants

For the sidebar (where space is tight), use just the Ko-fi cup image as a small icon button rather than the full banner.

---

## Configuration

### Environment Variable

Add `VITE_KOFI_USERNAME` to `frontend/.env` and `.env.example`:

```env
# Ko-fi username for support links (just the username, not the full URL)
VITE_KOFI_USERNAME=your_kofi_username
```

This keeps the Ko-fi page URL configurable and makes it easy to disable (empty = no Ko-fi buttons shown).

The full URL is constructed as: `https://ko-fi.com/${username}`

---

## Placements

### 1. Sidebar — Bottom section (desktop)

**Location**: `Sidebar.tsx`, between Theme button and user profile menu (lines 246-284)

**Expanded state**: A small Ko-fi button image (badge variant, ~150px wide) with subtle styling. Clicking opens Ko-fi in a new tab.

```
┌─────────────────────┐
│  🎨 Theme           │
│  ☕ Support on Ko-fi │  ← Ko-fi badge button image
│  👤 Username        │
└─────────────────────┘
```

**Collapsed state**: Just the Ko-fi cup icon (from the favicon asset) with a tooltip "Support on Ko-fi".

```
┌────┐
│ 🎨 │
│ ☕ │  ← Cup icon only, tooltip on hover
│ 👤 │
└────┘
```

### 2. Mobile "More" Drawer

**Location**: `BottomNav.tsx`, in the `<Drawer>` content between Theme and user profile (lines 144-158)

**Treatment**: Full Ko-fi button image (banner variant, matches drawer width). Same `<a>` wrapper.

```
──────────────
  🎨 Change Theme
  ☕ [Support me on Ko-fi]  ← Full banner button
  👤 Username
──────────────
```

### 3. Dashboard — Bottom card

**Location**: `DashboardPage.tsx`, as a new subtle card below "Recent Activity" (after line 172)

**Treatment**: A light card with Ko-fi cup + short text and a Ko-fi button image. Only shown when there's minimal content (always visible is fine too, it's at the bottom).

```
┌──────────────────────────────────┐
│ ☕ Enjoying Resumerator?         │
│ If this tool helps you land your │
│ next role, consider buying me a  │
│ coffee!                          │
│                                  │
│ [Support me on Ko-fi button]     │
└──────────────────────────────────┘
```

### 4. Home Page — Bottom CTA area

**Location**: `HomePage.tsx`, below the "Ready to get started?" card (after line 419)

**Treatment**: A simple centered line with the Ko-fi cup icon and text, sitting in the page footer area. Very subtle.

```
──────────────────────
  ☕ Built with love. Support this project on Ko-fi.
──────────────────────
```

---

## Dependencies

**New:** None — just static image assets and `<a>` tags.

**Assets to download:** Ko-fi brand asset pack → extract needed images into `frontend/public/kofi/`:
- `kofi_cup.png` (favicon/icon, for sidebar collapsed and home footer)
- `support_me_on_kofi_blue.png` (banner button, for dashboard and mobile drawer)
- `support_me_on_kofi_badge_blue.png` (badge button, for sidebar expanded)

Alternatively, reference the CDN URLs directly instead of self-hosting. Self-hosting is more reliable and avoids external requests.

---

## Phases

### Phase 1: Assets & Configuration

- [x] Download Ko-fi brand asset pack from CDN (Cloudflare blocked the ZIP, used direct image URLs)
- [x] Extract needed images into `frontend/public/kofi/`:
  - `cup.png` — the cup favicon (for icon-only placements)
  - `button_blue.png` — the full "Support me on Ko-fi" blue banner button
  - `badge_blue.png` — the compact badge variant
- [x] Add `VITE_KOFI_USERNAME` to `frontend/.env` and `frontend/.env.example`
- [x] Create `frontend/src/components/shared/KofiButton.tsx` — a reusable component that:
  - Accepts a `variant` prop: `"icon"` | `"badge"` | `"banner"`
  - Reads `VITE_KOFI_USERNAME` and constructs the link
  - Returns `null` if username is not configured (graceful disable)
  - Wraps the appropriate image in an `<a target="_blank" rel="noopener noreferrer">`
  - Icon variant: just the cup image (24px), with optional tooltip
  - Badge variant: the badge PNG (150px wide)
  - Banner variant: the full button PNG (200px wide)

### Phase 2: Sidebar & Mobile Drawer

- [x] Add `KofiButton` to `Sidebar.tsx` bottom section:
  - Expanded: `variant="badge"` between Theme and user menu
  - Collapsed: `variant="icon"` with Mantine `<Tooltip>` wrapping
- [x] Add `KofiButton` to `BottomNav.tsx` drawer:
  - `variant="banner"` between Theme button and user menu
- [x] Verify sidebar collapse/expand animation still looks smooth with the new element
- [x] Test that the link opens correctly in a new tab

### Phase 3: Dashboard & Home Page

- [x] Add Ko-fi card to `DashboardPage.tsx`:
  - New `<Card>` at the bottom of the page stack
  - Ko-fi cup image + friendly text + `KofiButton variant="banner"`
  - Styled with Ko-fi brand color as a subtle accent (light blue gradient bg)
- [x] Add Ko-fi footer line to `HomePage.tsx`:
  - Below the "Ready to get started?" card
  - Centered text with Ko-fi cup icon inline + link
  - Muted color, small text — unobtrusive footer feel

### Phase 4: Polish & Dark Mode

- [x] Test all placements in both light and dark mode (blue buttons have good contrast on both)
- [x] Ensure images are properly sized and don't cause layout shifts
- [x] Verify all links include `rel="noopener noreferrer"` and `target="_blank"`
- [x] Frontend builds successfully with no TypeScript errors

---

## Implementation Notes

### KofiButton Component Sketch

```tsx
const KOFI_USERNAME = import.meta.env.VITE_KOFI_USERNAME;

interface KofiButtonProps {
  variant: "icon" | "badge" | "banner";
  tooltip?: boolean;
}

export function KofiButton({ variant, tooltip = true }: KofiButtonProps) {
  if (!KOFI_USERNAME) return null;

  const url = `https://ko-fi.com/${KOFI_USERNAME}`;

  const images = {
    icon: { src: "/kofi/cup.png", width: 24, alt: "Ko-fi cup" },
    badge: { src: "/kofi/badge_blue.png", width: 150, alt: "Support me on Ko-fi" },
    banner: { src: "/kofi/button_blue.png", width: 200, alt: "Support me on Ko-fi" },
  };

  const img = images[variant];

  const link = (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex" }}>
      <img src={img.src} alt={img.alt} width={img.width} style={{ display: "block" }} />
    </a>
  );

  if (tooltip && variant === "icon") {
    return <Tooltip label="Support on Ko-fi" position="right">{link}</Tooltip>;
  }

  return link;
}
```

### Dark Mode Consideration

Ko-fi provides buttons in 4 color variants. If the app's dark mode makes the blue button look odd, we can:
- Use `_beige.png` for dark mode (warm, visible on dark backgrounds)
- Or use `_dark.png` for light mode and `_blue.png` for dark mode
- Read from `useMantineColorScheme()` to swap dynamically

This is a polish item — start with the blue variant everywhere and adjust if needed.

### Why Not the Ko-fi Widget Script

Ko-fi's `kofiwidget2.js` and `overlay-widget.js` use `document.write()` which:
- Doesn't work well in React SPAs (components render after initial page load)
- Triggers PageSpeed Insights warnings
- Can't be controlled per-page or hidden contextually

Static image assets wrapped in links are simpler, faster, and give full layout control.

---

## Effort Estimate

| Phase | Effort | Notes |
|-------|--------|-------|
| Phase 1 | Small | Download assets, create one component |
| Phase 2 | Small | Add component to 2 existing files |
| Phase 3 | Small | Add card and footer line |
| Phase 4 | Small | Visual QA |

**Total: ~30-45 minutes**

---

## Status: Complete

### Implementation Summary

All 4 placements implemented successfully:

1. **Sidebar (desktop)**: Badge button when expanded, cup icon when collapsed
2. **Mobile "More" drawer**: Full banner button between Theme and user menu
3. **Dashboard**: Friendly card with Ko-fi cup + message and banner button
4. **Home page footer**: Centered text with cup icon and link

The Ko-fi username is configured via `VITE_KOFI_USERNAME=arik956669` in `.env`. All Ko-fi buttons/links gracefully hide if the env var is empty.

Ko-fi assets downloaded and stored in `frontend/public/kofi/`:
- `cup.png` (Ko-fi cup icon)
- `badge_blue.png` (compact badge button)
- `button_blue.png` (full banner button)

Created reusable `KofiButton` component with three variants: `icon`, `badge`, and `banner`.

Frontend builds successfully with no TypeScript errors.
