import { MantineColorsTuple } from "@mantine/core";
import { AppTheme } from "../types";

const purple: MantineColorsTuple = [
  "#f3f0ff",
  "#e5dbff",
  "#d0bfff",
  "#b197fc",
  "#9775fa",
  "#845ef7",
  "#7950f2",
  "#7048e8",
  "#6741d9",
  "#5f3dc4",
];

export const defaultTheme: AppTheme = {
  id: "default",
  name: "Default",
  description: "Clean, professional, and perfectly purple.",

  mantineTheme: {
    primaryColor: "purple",
    colors: {
      purple,
    },
    defaultRadius: "md",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
  },

  headerGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",

  sillyMessages: {
    analyze: [
      "Reticulating career splines...",
      "Consulting the resume oracle...",
      "Cross-referencing buzzwords with the cosmos...",
      "Calibrating achievement metrics...",
      "Scanning for dangerously high synergy levels...",
      "Decrypting your professional potential...",
      "Asking the AI if it's impressed yet...",
      "Counting action verbs per paragraph...",
      "Comparing your skills to a very long spreadsheet...",
      "Feeding your resume to a very sophisticated hamster wheel...",
    ],
    generate: [
      "Assembling your professional narrative...",
      "Optimizing bullet point velocity...",
      "Aligning achievement matrices...",
      "Polishing professional prose to a fine sheen...",
      "Teaching the AI to humble-brag on your behalf...",
      "Converting coffee-fueled effort into metrics...",
      "Sprinkling in just the right amount of synergy...",
      "Crafting the perfect amount of buzzword density...",
      "Convincing the algorithm you're a team player AND a self-starter...",
      "Translating 'wore many hats' into something more impressive...",
    ],
    enrich: [
      "Absorbing your professional essence...",
      "Cataloging years of hard-won experience...",
      "Teaching the AI about your career journey...",
      "Converting your achievements into structured data...",
      "Parsing decades of hustle...",
      "Indexing your professional awesomeness...",
      "Untangling your career spaghetti into something beautiful...",
      "Filing your skills in alphabetical order... just kidding...",
    ],
  },

  tagline: "Your resume's new best friend. Or at least its most honest critic.",

  featureDescriptions: {
    profile:
      "Your professional identity. Think of it as the source code for all your resumes.",
    resumes:
      "Where your resumes live, breathe, and occasionally get a glow-up.",
    companies:
      "Keep tabs on the companies you're wooing. They don't need to know yet.",
    jobs: "Track every job posting. Because bookmarking 47 browser tabs isn't a strategy.",
    analyze:
      "Let AI judge your resume so humans don't have to. Brutally honest, but fair.",
    generate:
      "AI-crafted resumes tailored to specific jobs. Like a bespoke suit, but for words.",
    history:
      "Everything you've done, logged and timestamped. Your alibi, if you will.",
  },
};
