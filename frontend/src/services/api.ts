import type {
  PersonInfo,
  CompanyInfo,
  JobInfo,
  SavedResult,
  ImportResumeResponse,
  ImportJobResponse,
  ImportCompanyResponse,
  FileContentResponse,
  ReviewResult,
  JobFitResult,
  BuilderResult,
} from './types';

const API_BASE = '/api';

// Helper function for fetch with error handling
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

// Project APIs
export async function getPeople(): Promise<PersonInfo[]> {
  return fetchJson(`${API_BASE}/project/people`);
}

export async function getCompanies(): Promise<CompanyInfo[]> {
  return fetchJson(`${API_BASE}/project/companies`);
}

export async function getJobs(company: string): Promise<JobInfo[]> {
  return fetchJson(`${API_BASE}/project/jobs/${encodeURIComponent(company)}`);
}

export async function addPerson(name: string): Promise<PersonInfo> {
  return fetchJson(`${API_BASE}/project/person`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export async function addCompany(name: string): Promise<CompanyInfo> {
  return fetchJson(`${API_BASE}/project/company`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export async function addJob(company: string, title: string): Promise<JobInfo> {
  return fetchJson(`${API_BASE}/project/job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company, title }),
  });
}

// Import APIs
export async function importResume(data: FormData): Promise<ImportResumeResponse> {
  return fetchJson(`${API_BASE}/import/resume`, {
    method: 'POST',
    body: data,
  });
}

export async function importJob(data: {
  mode: 'create' | 'append';
  company: string;
  jobName: string;
  jobText: string;
}): Promise<ImportJobResponse> {
  return fetchJson(`${API_BASE}/import/job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function importCompany(data: {
  mode: 'create' | 'append';
  companyName: string;
  companyText: string;
}): Promise<ImportCompanyResponse> {
  return fetchJson(`${API_BASE}/import/company`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// File editing APIs
export async function getPersonFile(name: string): Promise<FileContentResponse> {
  return fetchJson(`${API_BASE}/files/person/${encodeURIComponent(name)}`);
}

export async function updatePersonFile(name: string, content: string): Promise<{ success: boolean }> {
  return fetchJson(`${API_BASE}/files/person/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}

export async function getCompanyFile(name: string): Promise<FileContentResponse> {
  return fetchJson(`${API_BASE}/files/company/${encodeURIComponent(name)}`);
}

export async function updateCompanyFile(name: string, content: string): Promise<{ success: boolean }> {
  return fetchJson(`${API_BASE}/files/company/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}

export async function getJobFile(company: string, job: string): Promise<FileContentResponse> {
  return fetchJson(`${API_BASE}/files/job/${encodeURIComponent(company)}/${encodeURIComponent(job)}`);
}

export async function updateJobFile(
  company: string,
  job: string,
  content: string
): Promise<{ success: boolean }> {
  return fetchJson(`${API_BASE}/files/job/${encodeURIComponent(company)}/${encodeURIComponent(job)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}

// Resume APIs
export async function getPersonResumes(name: string): Promise<{ resumes: string[] }> {
  return fetchJson(`${API_BASE}/files/person/${encodeURIComponent(name)}/resumes`);
}

export async function getResumeFile(name: string, resume: string): Promise<FileContentResponse> {
  return fetchJson(`${API_BASE}/files/person/${encodeURIComponent(name)}/resumes/${encodeURIComponent(resume)}`);
}

export async function updateResumeFile(
  name: string,
  resume: string,
  content: string
): Promise<{ success: boolean }> {
  return fetchJson(`${API_BASE}/files/person/${encodeURIComponent(name)}/resumes/${encodeURIComponent(resume)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}

// Review and Build APIs
export async function runReview(data: FormData): Promise<ReviewResult | JobFitResult> {
  return fetchJson(`${API_BASE}/review`, {
    method: 'POST',
    body: data,
  });
}

export async function runBuild(data: Record<string, any>): Promise<BuilderResult> {
  return fetchJson(`${API_BASE}/build`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// Results APIs
export async function getResults(filters?: {
  type?: string;
  person?: string;
  company?: string;
}): Promise<SavedResult[]> {
  const params = new URLSearchParams();
  if (filters?.type) params.append('type', filters.type);
  if (filters?.person) params.append('person', filters.person);
  if (filters?.company) params.append('company', filters.company);

  const query = params.toString();
  return fetchJson(`${API_BASE}/results${query ? `?${query}` : ''}`);
}

export async function getResult(filename: string): Promise<any> {
  return fetchJson(`${API_BASE}/results/${encodeURIComponent(filename)}`);
}
