import { MantineColorsTuple } from "@mantine/core";
import { AppTheme } from "../types";

const taupe: MantineColorsTuple = [
  "#f7f5f2",
  "#e8e4de",
  "#d4cdc3",
  "#bfb5a8",
  "#aba08f",
  "#998d7d",
  "#8a7f6f",
  "#756b5d",
  "#635a4e",
  "#534b41",
];

export const designerTheme: AppTheme = {
  id: "designer",
  name: "Designer",
  description: "Elegant. Intentional. Beautifully crafted.",

  mantineTheme: {
    primaryColor: "taupe",
    colors: {
      taupe,
    },
    defaultRadius: "md",
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif',
  },

  headerGradient: "linear-gradient(135deg, #d4cdc3 0%, #a89f94 100%)",

  sillyMessages: {
    analyze: [
      "Critiquing your professional canvas...",
      "Studying the composition of your experience...",
      "Evaluating the typography of your career...",
      "Assessing the negative space in your resume...",
      "Reviewing your professional color palette...",
      "Measuring the visual weight of your achievements...",
      "Checking the kerning on your career narrative...",
      "Examining the hierarchy of your skills...",
      "Evaluating flow and rhythm...",
      "Curating feedback with care...",
    ],
    generate: [
      "Designing your professional masterpiece...",
      "Selecting the perfect typeface for your career...",
      "Composing a visual narrative...",
      "Arranging elements on the career canvas...",
      "Applying the golden ratio to your achievements...",
      "Whitespace-optimizing your experience...",
      "Art-directing your professional story...",
      "Sketching the perfect layout...",
      "Adding finishing touches...",
      "Polishing your portfolio piece...",
    ],
    enrich: [
      "Sketching your professional portrait...",
      "Mixing your career color palette...",
      "Drafting your experience wireframe...",
      "Styling your professional mood board...",
      "Curating your skill gallery...",
      "Illustrating your career arc...",
      "Framing your achievements...",
      "Composing your creative brief...",
    ],
  },

  tagline: "Crafting careers with elegance and intention.",

  featureDescriptions: {
    profile:
      "Your brand identity. The design system that defines your professional aesthetic.",
    resumes:
      "Your portfolio of professional narratives. Each one crafted with purpose.",
    companies:
      "The studios and galleries you admire. Curate your dream collaborations.",
    jobs: "Design briefs from the universe. Find opportunities that inspire.",
    analyze:
      "A thoughtful critique session. Constructive feedback on your visual story.",
    generate:
      "Custom-designed career documents. Tailored layouts for every opportunity.",
    history:
      "Your creative process, documented. A gallery of your professional evolution.",
  },

  featureColors: {
    profile: "taupe",
    resumes: "orange",
    companies: "yellow",
    jobs: "lime",
    analyze: "pink",
    generate: "grape",
    history: "gray",
  },
};
