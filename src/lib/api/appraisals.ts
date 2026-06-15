/** erp-api appraisal endpoints: cycles, templates, questions, appraisals (+ workflow),
 *  responses, goals (+ progress). */

import { apiClient } from "@/lib/api/client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

const APP = "/hrm/appraisals";

export interface AppraisalCycle {
  id: number | string;
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface AppraisalTemplate {
  id: number | string;
  name?: string;
  description?: string;
  is_active?: boolean;
  question_count?: number;
  [key: string]: unknown;
}

export interface AppraisalQuestion {
  id: number | string;
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
  id: number | string;
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
  id: number | string;
  appraisal?: number;
  question?: number;
  question_text?: string;
  score?: string | number;
  comment?: string;
  [key: string]: unknown;
}

export interface Goal {
  id: number | string;
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

function crud<T extends { id: number | string }>(segment: string) {
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
    // erp-api: single status setter PUT /cycles/{id}/status.
    setStatus: (id: number | string, status: string) =>
      apiClient.put<AppraisalCycle>(`${APP}/cycles/${id}/status`, { status }),
    activate: (id: number | string) =>
      apiClient.put<AppraisalCycle>(`${APP}/cycles/${id}/status`, { status: "active" }),
    close: (id: number | string) =>
      apiClient.put<AppraisalCycle>(`${APP}/cycles/${id}/status`, { status: "closed" }),
    reopen: (id: number | string) =>
      apiClient.put<AppraisalCycle>(`${APP}/cycles/${id}/status`, { status: "active" }),
  },
  templates: crud<AppraisalTemplate>("templates"),
  // Questions are scoped under a template (no top-level /questions route).
  questions: {
    list: (templateId: number | string, params?: ListParams) =>
      apiClient.get<Paginated<AppraisalQuestion> | AppraisalQuestion[]>(
        `${APP}/templates/${templateId}/questions`,
        params,
      ),
    create: (templateId: number | string, data: Partial<AppraisalQuestion>) =>
      apiClient.post<AppraisalQuestion>(`${APP}/templates/${templateId}/questions`, {
        question_text: data.question_text ?? data.text,
        question_type: (data as Record<string, unknown>).question_type,
        is_required: (data as Record<string, unknown>).is_required,
        order: data.order,
      }),
  },
  goals: {
    ...crud<Goal>("goals"),
    // erp-api goal create body: {employee_id,title,description,start_date,
    // end_date,is_template}. UI form uses employee/target_date/is_library.
    create: (data: Partial<Goal>) =>
      apiClient.post<Goal>(`${APP}/goals/`, {
        employee_id: data.employee,
        title: data.title,
        description: data.description,
        start_date: (data as Record<string, unknown>).start_date,
        end_date: data.end_date ?? data.target_date,
        is_template: data.is_library ?? false,
      }),
    // erp-api: POST /goals/{id}/progress.
    updateProgress: (id: number | string, data: { progress: number | string; note?: string }) =>
      apiClient.post<Goal>(`${APP}/goals/${id}/progress`, data),
    listProgress: (id: number | string) => apiClient.get(`${APP}/goals/${id}/progress`),
  },
  // Appraisals themselves live at the collection root (/hrm/appraisals/), not
  // a nested /appraisals segment.
  appraisals: {
    list: (params?: ListParams) =>
      apiClient.get<Paginated<Appraisal> | Appraisal[]>(`${APP}/`, params),
    get: (id: number | string) => apiClient.get<Appraisal>(`${APP}/${id}/`),
    create: (data: Partial<Appraisal>) =>
      apiClient.post<Appraisal>(`${APP}/`, {
        cycle_id: data.cycle,
        employee_id: data.employee,
        template_id: data.template,
        evaluator_id: data.reviewer ?? (data as Record<string, unknown>).evaluator,
      }),
    // NOTE: erp-api has no PUT/DELETE on an appraisal (gap); kept on the
    // canonical paths so they work once those routes land.
    update: (id: number | string, data: Partial<Appraisal>) =>
      apiClient.put<Appraisal>(`${APP}/${id}/`, data),
    remove: (id: number | string) => apiClient.delete<void>(`${APP}/${id}/`),
    // erp-api: single status setter PUT /{id}/status (no submit/approve/reject
    // routes — the status value drives the transition).
    setStatus: (id: number | string, status: string, extra?: Record<string, unknown>) =>
      apiClient.put<Appraisal>(`${APP}/${id}/status`, { status, ...extra }),
    submit: (id: number | string) =>
      apiClient.put<Appraisal>(`${APP}/${id}/status`, { status: "submitted" }),
    approve: (id: number | string) =>
      apiClient.put<Appraisal>(`${APP}/${id}/status`, { status: "approved" }),
    reject: (id: number | string, reason: string) =>
      apiClient.put<Appraisal>(`${APP}/${id}/status`, { status: "rejected", rejection_reason: reason }),
    reopen: (id: number | string) =>
      apiClient.put<Appraisal>(`${APP}/${id}/status`, { status: "draft" }),
  },
  // Responses are scoped under an appraisal id.
  listResponses: (appraisalId: number | string) =>
    apiClient.get<Paginated<AppraisalResponse> | AppraisalResponse[]>(
      `${APP}/${appraisalId}/responses`,
    ),
  createResponses: (appraisalId: number | string, data: unknown) =>
    apiClient.post<AppraisalResponse[]>(`${APP}/${appraisalId}/responses`, data),
};
