/** erp-api appraisal endpoints: cycles, templates, questions, appraisals (+ workflow),
 *  responses, goals (+ progress). */

import { apiClient } from "@/lib/api/client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

const APP = "/hrm/appraisals";

export interface AppraisalCycle {
  id: number;
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface AppraisalTemplate {
  id: number;
  name?: string;
  description?: string;
  is_active?: boolean;
  question_count?: number;
  [key: string]: unknown;
}

export interface AppraisalQuestion {
  id: number;
  template?: number;
  template_name?: string;
  text?: string;
  question_text?: string;
  category?: string;
  weight?: string | number;
  max_score?: string | number;
  order?: number;
  [key: string]: unknown;
}

export interface Appraisal {
  id: number;
  employee?: number;
  employee_name?: string;
  cycle?: number;
  cycle_name?: string;
  template?: number;
  template_name?: string;
  reviewer?: number;
  reviewer_name?: string;
  status?: string;
  overall_score?: string | number;
  rejection_reason?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface AppraisalResponse {
  id: number;
  appraisal?: number;
  question?: number;
  question_text?: string;
  score?: string | number;
  comment?: string;
  [key: string]: unknown;
}

export interface Goal {
  id: number;
  employee?: number;
  employee_name?: string;
  title?: string;
  description?: string;
  category?: string;
  target_date?: string;
  due_date?: string;
  progress?: string | number;
  weight?: string | number;
  status?: string;
  is_library?: boolean;
  created_at?: string;
  [key: string]: unknown;
}

function crud<T extends { id: number }>(segment: string) {
  const base = `${APP}/${segment}`;
  return {
    list: (params?: ListParams) => apiClient.get<Paginated<T> | T[]>(`${base}/`, params),
    get: (id: number | string) => apiClient.get<T>(`${base}/${id}/`),
    create: (data: Partial<T>) => apiClient.post<T>(`${base}/`, data),
    update: (id: number | string, data: Partial<T>) => apiClient.put<T>(`${base}/${id}/`, data),
    remove: (id: number | string) => apiClient.delete<void>(`${base}/${id}/`),
  };
}

export const appraisalApi = {
  cycles: {
    ...crud<AppraisalCycle>("cycles"),
    activate: (id: number | string) => apiClient.post<AppraisalCycle>(`${APP}/cycles/${id}/activate/`, {}),
    close: (id: number | string) => apiClient.post<AppraisalCycle>(`${APP}/cycles/${id}/close/`, {}),
    reopen: (id: number | string) => apiClient.post<AppraisalCycle>(`${APP}/cycles/${id}/reopen/`, {}),
  },
  templates: crud<AppraisalTemplate>("templates"),
  questions: crud<AppraisalQuestion>("questions"),
  goals: {
    ...crud<Goal>("goals"),
    updateProgress: (id: number | string, data: { progress: number | string; note?: string }) =>
      apiClient.post<Goal>(`${APP}/goals/${id}/update_progress/`, data),
  },
  appraisals: {
    ...crud<Appraisal>("appraisals"),
    submit: (id: number | string) => apiClient.post<Appraisal>(`${APP}/appraisals/${id}/submit/`, {}),
    approve: (id: number | string) => apiClient.post<Appraisal>(`${APP}/appraisals/${id}/approve/`, {}),
    reject: (id: number | string, reason: string) =>
      apiClient.post<Appraisal>(`${APP}/appraisals/${id}/reject/`, { rejection_reason: reason }),
    reopen: (id: number | string) => apiClient.post<Appraisal>(`${APP}/appraisals/${id}/reopen/`, {}),
  },
  // Responses (scoped to an appraisal)
  listResponses: (appraisalId: number | string) =>
    apiClient.get<Paginated<AppraisalResponse> | AppraisalResponse[]>(`${APP}/responses/`, {
      appraisal: appraisalId,
    }),
  createResponses: (data: unknown) => apiClient.post<AppraisalResponse[]>(`${APP}/responses/`, data),
  updateResponse: (id: number | string, data: Partial<AppraisalResponse>) =>
    apiClient.put<AppraisalResponse>(`${APP}/responses/${id}/`, data),
};
