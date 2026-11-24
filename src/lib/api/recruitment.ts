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
  requirements?: string;
  responsibilities?: string;
  salary_min?: string;
  salary_max?: string;
  salary_currency?: string;
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

/** erp-api application row with the candidate and job names the list adds. */
export interface JobApplication {
  id: string;
  candidate_id?: string;
  candidate_name?: string;
  candidate_email?: string;
  job_id?: string;
  job_title?: string;
  status?: ApplicationStage;
  applied_at?: string;
  interview_date?: string | null;
  offer_details?: string | null;
  rejection_reason?: string | null;
  hired_employee_id?: string | null;
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

/** Candidate states (kept in the candidate metadata by erp-api). */
export const CANDIDATE_STATUSES = [
  { value: "new", label: "New" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "hired", label: "Hired" },
];

function candidateBody(data: Partial<Candidate>) {
  return {
    full_name: data.full_name ?? data.name,
    email: data.email,
    phone: data.phone,
    source: data.source,
    status: data.status || undefined,
  };
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

export type ApplicationStage = "applied" | "screening" | "interview" | "offered" | "hired" | "rejected";

/**
 * Ordered recruitment pipeline stages (kanban columns), matching the erp-api application
 * states: applied -> screening -> interview -> offered -> hired, and any open stage ->
 * rejected.
 */
export const APPLICATION_STAGES: { value: ApplicationStage; label: string }[] = [
  { value: "applied", label: "Applied" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "offered", label: "Offer made" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
];

const NEXT_STAGE: Partial<Record<ApplicationStage, ApplicationStage>> = {
  applied: "screening",
  screening: "interview",
  interview: "offered",
  offered: "hired",
};

/** The one forward stage the API accepts from `stage`; undefined once hired or rejected. */
export function nextStage(stage?: string): ApplicationStage | undefined {
  return NEXT_STAGE[(stage || "applied") as ApplicationStage];
}

export function stageLabel(stage?: string): string {
  return APPLICATION_STAGES.find((s) => s.value === stage)?.label ?? stage ?? "";
}

/** Context the API records with a move: interview date, offer terms, rejection reason. */
export interface TransitionInput {
  status: ApplicationStage;
  /** On hire: also create the employee record and start onboarding. */
  create_employee?: boolean;
  /** YYYY-MM-DD, recorded when moving to interview. */
  interview_date?: string;
  offer_details?: string;
  rejection_reason?: string;
}

export interface TransitionResult {
  application: JobApplication;
  employee_id?: string;
  onboarding_id?: string;
}

export const recruitmentApi = {
  // erp-api postings segment is "postings", not "jobs".
  jobs: {
    ...crud<JobPosting>("postings"),
    setStatus: (id: number | string, status: string) =>
      apiClient.put<JobPosting>(`${REC}/postings/${id}/status`, { status }),
  },
  candidates: {
    ...crud<Candidate>("candidates"),
    // erp-api candidate body: {full_name, email, phone, source, status}.
    create: (data: Partial<Candidate>) => apiClient.post<Candidate>(`${REC}/candidates/`, candidateBody(data)),
    update: (id: number | string, data: Partial<Candidate>) =>
      apiClient.put<Candidate>(`${REC}/candidates/${id}/`, candidateBody(data)),
  },
  applications: {
    ...crud<JobApplication>("applications"),
    // erp-api exposes a single /transition taking the target status and its stage context.
    transition: (id: number | string, input: TransitionInput) =>
      apiClient.post<TransitionResult>(`${REC}/applications/${id}/transition`, input),
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
