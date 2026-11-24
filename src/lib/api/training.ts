/** erp-api training endpoints: courses, enrollments, evaluations. */

import { apiClient } from "@/lib/api/client";
import { type ListParams, type Paginated } from "@/lib/api/drf";

const TR = "/hrm/training";

/** erp-api course. provider, duration (hours), cost and status live in the course metadata
 *  and come back at the top level. */
export interface TrainingCourse {
  id: string;
  title?: string;
  description?: string;
  provider?: string;
  duration?: string;
  cost?: string;
  start_date?: string;
  end_date?: string;
  capacity?: number;
  status?: string;
  [key: string]: unknown;
}

export const COURSE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
];

/** erp-api enrolment with the employee name and course title the list adds. */
export interface TrainingEnrollment {
  id: string;
  employee_id?: string;
  employee_name?: string;
  course_id?: string;
  course_name?: string;
  status?: "enrolled" | "completed" | "cancelled";
  enrolled_at?: string;
  [key: string]: unknown;
}

export interface TrainingEvaluation {
  id: string;
  course_id?: string;
  course_name?: string;
  employee_id?: string;
  employee_name?: string;
  rating?: number;
  feedback?: string;
  created_at?: string;
  [key: string]: unknown;
}

/** Course create/update body. Blank numbers are left out (the API takes numbers only). */
function courseBody(data: Record<string, unknown>) {
  const num = (v: unknown) => (v === "" || v == null ? undefined : String(v));
  return {
    title: data.title ?? data.name,
    description: data.description,
    start_date: data.start_date,
    end_date: data.end_date,
    capacity: data.capacity === "" || data.capacity == null ? undefined : Number(data.capacity),
    provider: data.provider,
    duration: num(data.duration),
    cost: num(data.cost),
    status: data.status || undefined,
  };
}

export const trainingApi = {
  courses: {
    list: (params?: ListParams) =>
      apiClient.get<Paginated<TrainingCourse> | TrainingCourse[]>(`${TR}/courses/`, params),
    create: (data: Record<string, unknown>) => apiClient.post<TrainingCourse>(`${TR}/courses/`, courseBody(data)),
    update: (id: number | string, data: Record<string, unknown>) =>
      apiClient.put<TrainingCourse>(`${TR}/courses/${id}/`, courseBody(data)),
    remove: (id: number | string) => apiClient.delete<void>(`${TR}/courses/${id}/`),
  },
  evaluations: {
    list: (params?: ListParams) =>
      apiClient.get<Paginated<TrainingEvaluation> | TrainingEvaluation[]>(`${TR}/evaluations/`, params),
    // erp-api takes the course and employee of an enrolment; rating is a whole number 0-5.
    create: (data: { course_id: string; employee_id: string; rating?: number; feedback?: string }) =>
      apiClient.post<TrainingEvaluation>(`${TR}/evaluations/`, data),
  },
  enrollments: {
    list: (params?: ListParams) =>
      apiClient.get<Paginated<TrainingEnrollment> | TrainingEnrollment[]>(`${TR}/enrollments/`, params),
    // erp-api enrollment create reads {course_id, employee_id}.
    create: (data: Record<string, unknown>) =>
      apiClient.post<TrainingEnrollment>(`${TR}/enrollments/`, {
        course_id: data.course_id ?? data.course,
        employee_id: data.employee_id ?? data.employee,
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
