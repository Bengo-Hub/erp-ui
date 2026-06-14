"use client";

import {
  trainingApi,
  type TrainingCourse,
  type TrainingEnrollment,
  type TrainingEvaluation,
} from "@/lib/api/training";
import { makeActionHook, makeResourceHooks } from "@/hooks/use-crud-resource";

const courses = makeResourceHooks<TrainingCourse>("training-courses", trainingApi.courses, "Course");
export const useTrainingCourses = courses.useList;
export const useTrainingCourse = courses.useDetail;
export const useSaveTrainingCourse = courses.useSave;
export const useDeleteTrainingCourse = courses.useRemove;

const enrollments = makeResourceHooks<TrainingEnrollment>(
  "training-enrollments",
  trainingApi.enrollments,
  "Enrollment",
);
export const useTrainingEnrollments = enrollments.useList;
export const useSaveTrainingEnrollment = enrollments.useSave;
export const useDeleteTrainingEnrollment = enrollments.useRemove;
export const useCompleteEnrollment = makeActionHook(
  "training-enrollments",
  (id) => trainingApi.enrollments.complete(id),
  "Enrollment completed",
  "Failed to complete enrollment",
);
export const useCancelEnrollment = makeActionHook(
  "training-enrollments",
  (id) => trainingApi.enrollments.cancel(id),
  "Enrollment cancelled",
  "Failed to cancel enrollment",
);

const evaluations = makeResourceHooks<TrainingEvaluation>(
  "training-evaluations",
  trainingApi.evaluations,
  "Evaluation",
);
export const useTrainingEvaluations = evaluations.useList;
export const useSaveTrainingEvaluation = evaluations.useSave;
export const useDeleteTrainingEvaluation = evaluations.useRemove;
