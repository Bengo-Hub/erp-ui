"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { type ListParams } from "@/lib/api/drf";
import { extractApiError } from "@/lib/api/error";
import {
  trainingApi,
  type TrainingCourse,
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

/** Enrols an employee on a course, or with an id moves the enrolment to the course and
 *  employee given. */
export function useSaveTrainingEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: { course_id: string; employee_id: string } }) =>
      id ? trainingApi.enrollments.update(id, data) : trainingApi.enrollments.create(data),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: [ENROLLMENTS] });
      toast.success(v.id ? "Enrollment updated" : "Employee enrolled");
    },
    onError: (e, v) =>
      toast.error(extractApiError(e, v.id ? "Failed to update the enrollment" : "Failed to enrol the employee")),
  });
}

export function useDeleteTrainingEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trainingApi.enrollments.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ENROLLMENTS] });
      toast.success("Enrollment deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to delete the enrollment")),
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

/** Changes an evaluation's rating and feedback. */
export function useUpdateTrainingEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { rating: number; feedback?: string } }) =>
      trainingApi.evaluations.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EVALUATIONS] });
      toast.success("Evaluation updated");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to update the evaluation")),
  });
}

export function useDeleteTrainingEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trainingApi.evaluations.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EVALUATIONS] });
      toast.success("Evaluation deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to delete the evaluation")),
  });
}
