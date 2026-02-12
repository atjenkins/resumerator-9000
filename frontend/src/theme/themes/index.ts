import { AppTheme } from "../types";
import { defaultTheme } from "./default";
import { robotTheme } from "./robot";
import { designerTheme } from "./designer";
import { fairiesTheme } from "./fairies";

// Theme registry - maps theme IDs to theme objects
const themes: Record<string, AppTheme> = {
  default: defaultTheme,
  robot: robotTheme,
  designer: designerTheme,
  fairies: fairiesTheme,
};

/**
 * Get a theme by ID with fallback to default
 */
export function getTheme(id: string): AppTheme {
  return themes[id] || themes.default;
}

/**
 * Get all available themes
 */
export function getAllThemes(): AppTheme[] {
  return Object.values(themes);
}

/**
 * Get all theme IDs
 */
export function getThemeIds(): string[] {
  return Object.keys(themes);
}

export { themes, defaultTheme, robotTheme, designerTheme, fairiesTheme };
