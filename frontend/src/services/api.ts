import { supabase } from "./supabase";

// ============================================================
// Types
// ============================================================

export interface Analysis {
  id: string;
  user_id: string;
  source_type: "resume" | "profile";
  source_resume_id?: string;
  company_id?: string;
  job_id?: string;
  analysis_type: "general" | "job-fit";
  score?: number;
  fit_rating?: "excellent" | "good" | "moderate" | "poor";
  summary?: string;
  strengths?: any[];
  improvements?: any[];
  categories?: any[];
  missing_keywords?: any[];
  transferable_skills?: any[];
  targeted_suggestions?: any[];
  duration_ms?: number;
  created_at: string;
  // Joined data
  source_resume?: { id: string; title: string };
  job?: { id: string; title: string };
  company?: { id: string; name: string };
}

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  duration_ms?: number;
  source_type?: string;
  related_job_id?: string;
  related_company_id?: string;
  display_title: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  title: string;
  content: string;
  company_id?: string;
  job_id?: string;
  is_primary: boolean;
  origin: "manual" | "uploaded" | "generated";
  source_type?: "resume" | "profile";
  source_resume_id?: string;
  is_edited: boolean;
  generation_summary?: string;
  emphasized_skills?: any[];
  selected_experiences?: any[];
  generation_duration_ms?: number;
  created_at: string;
  updated_at: string;
}

// Normalize API base: must be full URL (https://...) so the browser doesn't treat hostname as a path
function normalizeApiBase(raw: string | undefined): string {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed.replace(/\/+$/, "");
  // Hostname without scheme → assume HTTPS in production
  return `https://${trimmed.replace(/\/+$/, "")}`;
}

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_URL);

// Helper function to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = {};

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  return headers;
}

// Helper function for fetch with error handling and auth
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const authHeaders = await getAuthHeaders();

  const finalOptions: RequestInit = {
    ...options,
    headers: {
      ...authHeaders,
      ...options?.headers,
    },
  };

  // Build full URL - if url already starts with http, use as-is, otherwise prepend API_BASE
  const fullUrl = url.startsWith("http") ? url : API_BASE + url;
  const response = await fetch(fullUrl, finalOptions);

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(error.error || "Request failed");
  }
  return response.json();
}

// ============================================================
// Profile API
// ============================================================

export async function getProfile() {
  return fetchJson("/api/profile", { method: "GET" });
}

export async function updateProfile(data: {
  display_name?: string;
  content?: string;
}) {
  return fetchJson("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function enrichProfile(data: {
  text: string;
  mode?: "merge" | "replace";
}) {
  return fetchJson("/api/profile/enrich", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ============================================================
// Companies API
// ============================================================

export async function getCompanies() {
  return fetchJson("/api/companies", { method: "GET" });
}

export async function getCompany(id: string) {
  return fetchJson(`/api/companies/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export async function createCompany(data: { name: string; content?: string }) {
  return fetchJson("/api/companies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateCompany(
  id: string,
  data: { name?: string; content?: string }
) {
  return fetchJson(`/api/companies/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteCompany(id: string) {
  return fetchJson(`/api/companies/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function parseCompanyInfo(text: string, companyName?: string) {
  return fetchJson("/api/companies/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, companyName, mode: "create" }),
  });
}

// ============================================================
// Jobs API
// ============================================================

export async function getJobs(companyId?: string) {
  const url = companyId
    ? `/api/jobs?companyId=${encodeURIComponent(companyId)}`
    : "/api/jobs";
  return fetchJson(url, { method: "GET" });
}

export async function getJob(id: string) {
  return fetchJson(`/api/jobs/${id}`, { method: "GET" });
}

export async function createJob(data: {
  title: string;
  content?: string;
  companyId?: string;
}) {
  return fetchJson("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateJob(
  id: string,
  data: { title?: string; content?: string; companyId?: string }
) {
  return fetchJson(`/api/jobs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteJob(id: string) {
  return fetchJson(`/api/jobs/${id}`, { method: "DELETE" });
}

export async function parseJobDescription(
  text: string,
  jobName?: string,
  companyId?: string
) {
  return fetchJson("/api/jobs/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, jobName, companyId, mode: "create" }),
  });
}

// ============================================================
// Resumes API
// ============================================================

export async function getResumes() {
  return fetchJson("/api/resumes", { method: "GET" });
}

export async function getResume(id: string) {
  return fetchJson(`/api/resumes/${id}`, { method: "GET" });
}

export async function createResume(data: {
  title: string;
  content: string;
  companyId?: string;
  jobId?: string;
  isPrimary?: boolean;
}) {
  return fetchJson("/api/resumes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateResume(
  id: string,
  data: {
    title?: string;
    content?: string;
    companyId?: string;
    jobId?: string;
    isPrimary?: boolean;
  }
) {
  return fetchJson(`/api/resumes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteResume(id: string) {
  return fetchJson(`/api/resumes/${id}`, { method: "DELETE" });
}

export async function parseResume(formData: FormData) {
  return fetchJson("/api/resumes/parse", {
    method: "POST",
    body: formData,
  });
}

// ============================================================
// Analysis Results API
// ============================================================

export async function getAnalyses(filters?: {
  sourceType?: "resume" | "profile";
  jobId?: string;
  resumeId?: string;
  analysisType?: "general" | "job-fit";
  minScore?: number;
  limit?: number;
  offset?: number;
}): Promise<{ results: Analysis[]; pagination: any }> {
  const params = new URLSearchParams();
  if (filters?.sourceType) params.append("sourceType", filters.sourceType);
  if (filters?.jobId) params.append("jobId", filters.jobId);
  if (filters?.resumeId) params.append("resumeId", filters.resumeId);
  if (filters?.analysisType) params.append("analysisType", filters.analysisType);
  if (filters?.minScore) params.append("minScore", filters.minScore.toString());
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.offset) params.append("offset", filters.offset.toString());

  const query = params.toString();
  return fetchJson(`/api/analyses${query ? `?${query}` : ""}`, {
    method: "GET",
  });
}

export async function getAnalysis(id: string): Promise<Analysis> {
  return fetchJson(`/api/analyses/${id}`, { method: "GET" });
}

export async function deleteAnalysis(id: string) {
  return fetchJson(`/api/analyses/${id}`, { method: "DELETE" });
}

// ============================================================
// Activity Log API
// ============================================================

export async function getActivityLog(filters?: {
  action?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ activities: ActivityLogEntry[]; pagination: any }> {
  const params = new URLSearchParams();
  if (filters?.action) params.append("action", filters.action);
  if (filters?.entityType) params.append("entityType", filters.entityType);
  if (filters?.entityId) params.append("entityId", filters.entityId);
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.offset) params.append("offset", filters.offset.toString());

  const query = params.toString();
  return fetchJson(`/api/activity${query ? `?${query}` : ""}`, {
    method: "GET",
  });
}

// ============================================================
// AI Operations API
// ============================================================

export async function analyzeDocument(data: {
  source: "resume" | "profile";
  resumeId?: string;
  companyId?: string;
  jobId?: string;
  save?: boolean;
}) {
  return fetchJson("/api/ai/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function generateResume(data: {
  source: "resume" | "profile";
  resumeId?: string;
  jobId: string;
  companyId?: string;
  save?: boolean;
}) {
  return fetchJson("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
