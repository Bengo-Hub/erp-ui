"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { type ListParams } from "@/lib/api/drf";
import { extractApiError } from "@/lib/api/error";
import {
  trainingApi,
  type TrainingCourse,
  type TrainingEnrollment,
} from "@/lib/api/training";
import { makeActionHook, makeResourceHooks } from "@/hooks/use-crud-resource";

const courses = makeResourceHooks<TrainingCourse>("training-courses", trainingApi.courses, "Course");
export const useTrainingCourses = courses.useList;
export const useSaveTrainingCourse = courses.useSave;
export const useDeleteTrainingCourse = courses.useRemove;

const ENROLLMENTS = "training-enrollments";

export function useTrainingEnrollments(params?: ListParams) {
  return useQuery({
    queryKey: [ENROLLMENTS, "list", params ?? {}],
    queryFn: () => trainingApi.enrollments.list(params),
    placeholderData: (prev) => prev,
  });
}

/** Enrols an employee on a course (erp-api has no enrolment edit; cancel instead). */
export function useSaveTrainingEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: Partial<TrainingEnrollment> & Record<string, unknown> }) =>
      trainingApi.enrollments.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ENROLLMENTS] });
      toast.success("Employee enrolled");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to enrol the employee")),
  });
}

export const useCompleteEnrollment = makeActionHook(
  ENROLLMENTS,
  (id) => trainingApi.enrollments.complete(id),
  "Enrollment completed",
  "Failed to complete enrollment",
);
export const useCancelEnrollment = makeActionHook(
  ENROLLMENTS,
  (id) => trainingApi.enrollments.cancel(id),
  "Enrollment cancelled",
  "Failed to cancel enrollment",
);

const EVALUATIONS = "training-evaluations";

export function useTrainingEvaluations(params?: ListParams) {
  return useQuery({
    queryKey: [EVALUATIONS, "list", params ?? {}],
    queryFn: () => trainingApi.evaluations.list(params),
    placeholderData: (prev) => prev,
  });
}

/** Records an evaluation for an enrolment (its course and employee). */
export function useCreateTrainingEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { course_id: string; employee_id: string; rating?: number; feedback?: string }) =>
      trainingApi.evaluations.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EVALUATIONS] });
      toast.success("Evaluation recorded");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to record the evaluation")),
  });
}
