import { MantineColorsTuple } from "@mantine/core";
import { AppTheme } from "../types";

const cyan: MantineColorsTuple = [
  "#e0fcff",
  "#cbf2f7",
  "#9ae2eb",
  "#64d2df",
  "#3bc5d4",
  "#20bdcd",
  "#09b9ca",
  "#00a3b3",
  "#0091a0",
  "#007d8c",
];

export const robotTheme: AppTheme = {
  id: "robot",
  name: "Technical Robot",
  description: "Cold. Efficient. Beep boop.",

  mantineTheme: {
    primaryColor: "cyan",
    colors: {
      cyan,
    },
    defaultRadius: "md",
    fontFamily:
      '"JetBrains Mono", "Fira Code", "Courier New", monospace, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
  },

  headerGradient: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",

  sillyMessages: {
    analyze: [
      "Running diagnostic protocols...",
      "Scanning resume firmware for bugs...",
      "Compiling career metrics...",
      "Executing talent.exe...",
      "Querying the professional database...",
      "Performing binary analysis of qualifications...",
      "Defragmenting your experience timeline...",
      "Running checksum on achievements...",
      "Initializing neural resume parser...",
      "Benchmarking against industry standards...",
    ],
    generate: [
      "Compiling optimized resume binary...",
      "Allocating memory for achievements...",
      "Building resume from source...",
      "Linking professional libraries...",
      "Deploying career firmware v2.0...",
      "Assembling instruction set for recruiters...",
      "Optimizing resume throughput...",
      "Generating human-readable output...",
      "Running career compiler...",
      "Flashing updated resume to disk...",
    ],
    enrich: [
      "Downloading professional data packets...",
      "Parsing career telemetry...",
      "Indexing skill modules...",
      "Mapping experience nodes...",
      "Syncing professional firmware...",
      "Loading career drivers...",
      "Calibrating experience sensors...",
      "Updating skill repository...",
    ],
  },

  tagline: "Resume optimization through superior engineering.",

  featureDescriptions: {
    profile:
      "Your core system profile. The root directory of your professional file system.",
    resumes:
      "Resume repository. Version-controlled documents ready for deployment.",
    companies:
      "Target system registry. Monitor entities of interest with precision.",
    jobs: "Job posting cache. Index and query available positions in the network.",
    analyze:
      "Diagnostic analysis module. Execute comprehensive system checks on resume data.",
    generate:
      "Resume compilation unit. Build optimized output from source materials.",
    history:
      "System logs and event history. Complete audit trail of all operations.",
  },

  featureColors: {
    profile: "cyan",
    resumes: "teal",
    companies: "blue",
    jobs: "indigo",
    analyze: "green",
    generate: "lime",
    history: "gray",
  },
};
