/** erp-api training endpoints: courses, enrollments, evaluations. */

import { apiClient } from "@/lib/api/client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

const TR = "/hrm/training";

export interface TrainingCourse {
  id: number | string;
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
  id: number | string;
  employee?: number | string;
  employee_name?: string;
  course?: number | string;
  course_name?: string;
  status?: string;
  enrolled_at?: string;
  completed_at?: string;
  score?: string | number;
  [key: string]: unknown;
}

export interface TrainingEvaluation {
  id: number | string;
  enrollment?: number;
  employee_name?: string;
  course_name?: string;
  rating?: string | number;
  feedback?: string;
  created_at?: string;
  [key: string]: unknown;
}

function crud<T extends { id: number | string }>(segment: string) {
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
  courses: {
    ...crud<TrainingCourse>("courses"),
    // erp-api course body uses `title` (UI form field is `name`).
    create: (data: Partial<TrainingCourse>) =>
      apiClient.post<TrainingCourse>(`${TR}/courses/`, {
        title: data.title ?? data.name,
        description: data.description,
        start_date: data.start_date,
        end_date: data.end_date,
        capacity: (data as Record<string, unknown>).capacity,
      }),
  },
  evaluations: crud<TrainingEvaluation>("evaluations"),
  enrollments: {
    ...crud<TrainingEnrollment>("enrollments"),
    // erp-api enrollment create reads {course_id, employee_id}.
    create: (data: Partial<TrainingEnrollment>) =>
      apiClient.post<TrainingEnrollment>(`${TR}/enrollments/`, {
        course_id: data.course,
        employee_id: data.employee,
      }),
    // Lifecycle is a single status setter (PUT /enrollments/{id}/status).
    setStatus: (id: number | string, status: string) =>
      apiClient.put<TrainingEnrollment>(`${TR}/enrollments/${id}/status`, { status }),
    complete: (id: number | string) =>
      apiClient.put<TrainingEnrollment>(`${TR}/enrollments/${id}/status`, { status: "completed" }),
    cancel: (id: number | string) =>
      apiClient.put<TrainingEnrollment>(`${TR}/enrollments/${id}/status`, { status: "cancelled" }),
  },
};
