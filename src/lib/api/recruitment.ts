/** erp-api recruitment endpoints: jobs (postings), candidates, applications (+ pipeline),
 *  onboarding. */

import { apiClient } from "@/lib/api/client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

const REC = "/hrm/recruitment";

export interface JobPosting {
  id: number | string;
  title?: string;
  department?: number | string;
  department_name?: string;
  location?: string;
  employment_type?: string;
  description?: string;
  status?: string;
  openings?: number;
  num_positions?: number;
  is_public?: boolean;
  slug?: string;
  posted_date?: string;
  closing_date?: string;
  application_deadline?: string;
  [key: string]: unknown;
}

export interface Candidate {
  id: number | string;
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
  id: number | string;
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
  id: number | string;
  employee?: number;
  employee_id?: string;
  employee_name?: string;
  status?: string;
  progress?: string | number;
  start_date?: string;
  started_at?: string;
  completed_at?: string;
  probation_end_date?: string;
  [key: string]: unknown;
}

export interface OnboardingTask {
  id: string;
  onboarding_id?: string;
  category?: "IT" | "HR" | "Training" | "Other" | string;
  title?: string;
  order?: number;
  is_done?: boolean;
  done_at?: string | null;
  due_date?: string | null;
  assigned_to?: string | null;
  [key: string]: unknown;
}

function crud<T extends { id: number | string }>(segment: string) {
  const base = `${REC}/${segment}`;
  return {
    list: (params?: ListParams) => apiClient.get<Paginated<T> | T[]>(`${base}/`, params),
    get: (id: number | string) => apiClient.get<T>(`${base}/${id}/`),
    create: (data: Partial<T>) => apiClient.post<T>(`${base}/`, data),
    update: (id: number | string, data: Partial<T>) => apiClient.put<T>(`${base}/${id}/`, data),
    remove: (id: number | string) => apiClient.delete<void>(`${base}/${id}/`),
  };
}

/** Ordered recruitment pipeline stages (kanban columns). */
export const APPLICATION_STAGES = [
  { value: "applied", label: "Applied" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "hired", label: "Hired" },
];

/** The stage that follows `stage` in the pipeline (clamps at "hired"). */
export function nextStage(stage?: string): string {
  const order = APPLICATION_STAGES.map((s) => s.value);
  const idx = order.indexOf((stage || "applied").toLowerCase());
  return order[Math.min(idx < 0 ? 0 : idx + 1, order.length - 1)];
}

export const recruitmentApi = {
  // erp-api postings segment is "postings", not "jobs".
  jobs: {
    ...crud<JobPosting>("postings"),
    setStatus: (id: number | string, status: string) =>
      apiClient.put<JobPosting>(`${REC}/postings/${id}/status`, { status }),
  },
  candidates: crud<Candidate>("candidates"),
  applications: {
    ...crud<JobApplication>("applications"),
    // erp-api exposes a single /transition taking the target status.
    transition: (id: number | string, status: string, createEmployee = false) =>
      apiClient.post<JobApplication>(`${REC}/applications/${id}/transition`, {
        status,
        create_employee: createEmployee,
      }),
    advance: (id: number | string, currentStage?: string) =>
      apiClient.post<JobApplication>(`${REC}/applications/${id}/transition`, {
        status: nextStage(currentStage),
        create_employee: nextStage(currentStage) === "hired",
      }),
    reject: (id: number | string) =>
      apiClient.post<JobApplication>(`${REC}/applications/${id}/transition`, {
        status: "rejected",
      }),
  },
  onboarding: {
    ...crud<Onboarding>("onboarding"),
    // erp-api: tasks list + complete-by-taskID.
    listTasks: (id: number | string) =>
      apiClient.get<Paginated<OnboardingTask> | OnboardingTask[]>(`${REC}/onboarding/${id}/tasks`),
    completeTask: (taskId: number | string, done = true) =>
      apiClient.put<OnboardingTask>(`${REC}/onboarding/tasks/${taskId}/complete`, { done }),
    // Set a task's assignee and/or due date (empty due_date clears it).
    updateTask: (taskId: number | string, data: { assigned_to?: string; due_date?: string }) =>
      apiClient.put<OnboardingTask>(`${REC}/onboarding/tasks/${taskId}`, data),
    // Append a custom checklist item to an onboarding.
    addTask: (onboardingId: number | string, data: { category?: string; title: string }) =>
      apiClient.post<OnboardingTask>(`${REC}/onboarding/${onboardingId}/tasks`, data),
  },
};
