/** erp-api recruitment endpoints: jobs (postings), candidates, applications (+ pipeline),
 *  onboarding. */

import { apiClient } from "@/lib/api/client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

const REC = "/hrm/recruitment";

export interface JobPosting {
  id: number;
  title?: string;
  department?: number | string;
  department_name?: string;
  location?: string;
  employment_type?: string;
  description?: string;
  status?: string;
  openings?: number;
  posted_date?: string;
  closing_date?: string;
  [key: string]: unknown;
}

export interface Candidate {
  id: number;
  name?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface JobApplication {
  id: number;
  candidate?: number;
  candidate_name?: string;
  job?: number;
  job_title?: string;
  stage?: string;
  status?: string;
  applied_date?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface Onboarding {
  id: number;
  employee?: number;
  employee_name?: string;
  status?: string;
  progress?: string | number;
  start_date?: string;
  [key: string]: unknown;
}

function crud<T extends { id: number }>(segment: string) {
  const base = `${REC}/${segment}`;
  return {
    list: (params?: ListParams) => apiClient.get<Paginated<T> | T[]>(`${base}/`, params),
    get: (id: number | string) => apiClient.get<T>(`${base}/${id}/`),
    create: (data: Partial<T>) => apiClient.post<T>(`${base}/`, data),
    update: (id: number | string, data: Partial<T>) => apiClient.put<T>(`${base}/${id}/`, data),
    remove: (id: number | string) => apiClient.delete<void>(`${base}/${id}/`),
  };
}

export const recruitmentApi = {
  jobs: crud<JobPosting>("jobs"),
  candidates: crud<Candidate>("candidates"),
  applications: {
    ...crud<JobApplication>("applications"),
    advance: (id: number | string) =>
      apiClient.post<JobApplication>(`${REC}/applications/${id}/advance/`, {}),
    reject: (id: number | string, reason?: string) =>
      apiClient.post<JobApplication>(`${REC}/applications/${id}/reject/`, { reason }),
  },
  onboarding: {
    ...crud<Onboarding>("onboarding"),
    start: (id: number | string) => apiClient.post<Onboarding>(`${REC}/onboarding/${id}/start/`, {}),
  },
};

/** Ordered recruitment pipeline stages (kanban columns). */
export const APPLICATION_STAGES = [
  { value: "applied", label: "Applied" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "hired", label: "Hired" },
];
