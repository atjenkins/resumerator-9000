import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  themeId: string;
  setThemeId: (id: string) => void;
}

/**
 * Theme store with localStorage persistence
 * 
 * Only stores the theme ID string. Components derive the full AppTheme
 * object by calling getTheme(themeId) from themes/index.ts
 * 
 * Persistence ensures:
 * - No flash of wrong theme on page load (localStorage hydrates instantly)
 * - User preference is cached between sessions
 * - Database sync happens via profile update (Phase 2e)
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: "default",
      setThemeId: (id: string) => set({ themeId: id }),
    }),
    {
      name: "resumerator-theme", // localStorage key
    }
  )
);
