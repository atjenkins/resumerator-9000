// Project types
export interface PersonInfo {
  name: string;
  path: string;
  personPath: string;
  resumesPath: string;
}

export interface CompanyInfo {
  name: string;
  path: string;
  companyPath: string;
  jobsPath: string;
  jobs: string[];
}

export interface JobInfo {
  company: string;
  name: string;
  path: string;
}

// Review result types
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

// Result metadata
export type ResultType = 'general' | 'company' | 'job' | 'review' | 'build';

export interface ResultMetadata {
  type: ResultType;
  timestamp: string;
  person?: string;
  personFile?: string;
  company?: string;
  companyFile?: string;
  job?: string;
  jobFile?: string;
}

export interface SavedResult {
  filename: string;
  path: string;
  metadata: ResultMetadata;
}

// API response types
export interface ImportResumeResponse {
  success: boolean;
  personName: string;
  filePath: string;
  preview: string;
}

export interface ImportJobResponse {
  success: boolean;
  jobName: string;
  filePath: string;
  preview: string;
}

export interface ImportCompanyResponse {
  success: boolean;
  companyName: string;
  filePath: string;
  preview: string;
}

export interface FileContentResponse {
  content: string;
}

export interface ApiError {
  error: string;
}
