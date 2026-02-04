export interface CategoryScore {
  name: string;
  score: number;
  feedback: string;
}

export interface ReviewResult {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  categories: CategoryScore[];
}

export interface JobFitResult extends ReviewResult {
  fitRating: 'excellent' | 'good' | 'moderate' | 'poor';
  missingKeywords: string[];
  transferableSkills: string[];
  targetedSuggestions: string[];
}

export interface BuilderResult {
  markdown: string;
  summary: string;
  emphasizedSkills: string[];
  selectedExperiences: string[];
}

export interface ParsedDocument {
  content: string;
  metadata?: {
    pageCount?: number;
    title?: string;
  };
}

export type AgentType = 'general' | 'job-fit' | 'builder';
