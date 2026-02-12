import { MantineColorsTuple } from "@mantine/core";
import { AppTheme } from "../types";

const lavender: MantineColorsTuple = [
  "#faf5ff",
  "#f3e8ff",
  "#e9d5ff",
  "#d8b4fe",
  "#c084fc",
  "#a855f7",
  "#9333ea",
  "#7e22ce",
  "#6b21a8",
  "#581c87",
];

export const fairiesTheme: AppTheme = {
  id: "fairies",
  name: "Fairies",
  description: "Whimsical. Magical. Sprinkled with stardust.",

  mantineTheme: {
    primaryColor: "lavender",
    colors: {
      lavender,
    },
    defaultRadius: "xl",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, "Comic Sans MS", sans-serif',
  },

  headerGradient: "linear-gradient(135deg, #a855f7 0%, #ec4899 30%, #fbbf24 60%, #34d399 100%)",

  sillyMessages: {
    analyze: [
      "Consulting the career fairy council...",
      "Reading your resume's tea leaves...",
      "Casting a spell of professional insight...",
      "Summoning the feedback sprites...",
      "Gazing into the crystal ball of employment...",
      "Asking the woodland creatures for their opinion...",
      "Sprinkling analysis dust...",
      "The resume gnomes are reviewing...",
      "Enchanting your qualifications...",
      "Brewing a potion of career wisdom...",
    ],
    generate: [
      "Weaving your career tapestry...",
      "The resume fairies are hard at work...",
      "Enchanting words onto parchment...",
      "Casting a tailoring spell...",
      "Gathering moonlit achievements...",
      "The pixies are polishing your prose...",
      "Spinning career gold from experience straw...",
      "Conjuring the perfect resume...",
      "Summoning the muse of employment...",
      "Adding a sprinkle of fairy dust...",
    ],
    enrich: [
      "The forest spirits are reading your story...",
      "Gathering dewdrops of experience...",
      "The wise owl is organizing your skills...",
      "Planting seeds of professional growth...",
      "Weaving your experience into a magic carpet...",
      "The enchanted quill is taking notes...",
      "Bottling your career essence...",
      "Tending the garden of your achievements...",
    ],
  },

  tagline: "A sprinkle of magic for your career journey.",

  featureDescriptions: {
    profile:
      "Your magical essence. The storybook of your professional adventures.",
    resumes:
      "Enchanted scrolls of your career tales. Each one blessed by the muse.",
    companies:
      "Castles and kingdoms you wish to visit. Dream destinations await.",
    jobs: "Quests and adventures from the realm. Find your next magical mission.",
    analyze:
      "The wise oracle's counsel. Mystical insights into your professional path.",
    generate:
      "Spellbound resumes woven by fairies. Each word touched by magic.",
    history:
      "Your book of career spells. Every chapter written in stardust.",
  },
};
