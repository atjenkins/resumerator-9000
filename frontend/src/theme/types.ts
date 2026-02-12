import { MantineThemeOverride } from "@mantine/core";

export interface AppTheme {
  // Identity
  id: string; // "default" | "robot" | "designer" | "fairies"
  name: string; // Display name
  description: string; // Short tagline for the theme picker

  // Mantine theme override (primaryColor, colors, fontFamily, defaultRadius, etc.)
  mantineTheme: MantineThemeOverride;

  // Custom styling tokens (beyond Mantine's scope)
  headerGradient: string; // CSS gradient for the app header

  // Personality text
  sillyMessages: {
    analyze: string[];
    generate: string[];
    enrich: string[];
  };

  // Home page flavor text
  tagline: string; // Hero subtitle on home page
  featureDescriptions: {
    // Per-section descriptions for home page cards
    profile: string;
    resumes: string;
    companies: string;
    jobs: string;
    analyze: string;
    generate: string;
    history: string;
  };

  // Per-feature accent colors (Mantine color names)
  featureColors: {
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
