/** erp-api training endpoints: courses, enrollments, evaluations. */

import { apiClient } from "@/lib/api/client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

const TR = "/hrm/training";

export interface TrainingCourse {
  id: number;
  name?: string;
  title?: string;
  description?: string;
  provider?: string;
  duration?: string | number;
  cost?: string | number;
  start_date?: string;
  end_date?: string;
  status?: string;
  [key: string]: unknown;
}

export interface TrainingEnrollment {
  id: number;
  employee?: number;
  employee_name?: string;
  course?: number;
  course_name?: string;
  status?: string;
  enrolled_at?: string;
  completed_at?: string;
  score?: string | number;
  [key: string]: unknown;
}

export interface TrainingEvaluation {
  id: number;
  enrollment?: number;
  employee_name?: string;
  course_name?: string;
  rating?: string | number;
  feedback?: string;
  created_at?: string;
  [key: string]: unknown;
}

function crud<T extends { id: number }>(segment: string) {
  const base = `${TR}/${segment}`;
  return {
    list: (params?: ListParams) => apiClient.get<Paginated<T> | T[]>(`${base}/`, params),
    get: (id: number | string) => apiClient.get<T>(`${base}/${id}/`),
    create: (data: Partial<T>) => apiClient.post<T>(`${base}/`, data),
    update: (id: number | string, data: Partial<T>) => apiClient.put<T>(`${base}/${id}/`, data),
    remove: (id: number | string) => apiClient.delete<void>(`${base}/${id}/`),
  };
}

export const trainingApi = {
  courses: crud<TrainingCourse>("courses"),
  evaluations: crud<TrainingEvaluation>("evaluations"),
  enrollments: {
    ...crud<TrainingEnrollment>("enrollments"),
    complete: (id: number | string) =>
      apiClient.post<TrainingEnrollment>(`${TR}/enrollments/${id}/complete/`, {}),
    cancel: (id: number | string) =>
      apiClient.post<TrainingEnrollment>(`${TR}/enrollments/${id}/cancel/`, {}),
  },
};
