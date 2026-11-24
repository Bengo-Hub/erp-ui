"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  recruitmentApi,
  stageLabel,
  type TransitionInput,
  type Candidate,
  type JobApplication,
  type JobPosting,
  type Onboarding,
} from "@/lib/api/recruitment";
import { extractApiError } from "@/lib/api/error";
import { makeResourceHooks } from "@/hooks/use-crud-resource";

const jobs = makeResourceHooks<JobPosting>("recruitment-jobs", recruitmentApi.jobs, "Job posting");
export const useJobPostings = jobs.useList;
export const useJobPosting = jobs.useDetail;
export const useSaveJobPosting = jobs.useSave;
export const useDeleteJobPosting = jobs.useRemove;

const candidates = makeResourceHooks<Candidate>("recruitment-candidates", recruitmentApi.candidates, "Candidate");
export const useCandidates = candidates.useList;
export const useCandidate = candidates.useDetail;
export const useSaveCandidate = candidates.useSave;
export const useDeleteCandidate = candidates.useRemove;

const applications = makeResourceHooks<JobApplication>(
  "recruitment-applications",
  recruitmentApi.applications,
  "Application",
);
export const useApplications = applications.useList;
export const useSaveApplication = applications.useSave;
export const useDeleteApplication = applications.useRemove;

/**
 * Moves an application to another pipeline stage (erp-api /transition). On hire with
 * create_employee the API also creates the employee record and starts onboarding.
 */
export function useTransitionApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TransitionInput }) =>
      recruitmentApi.applications.transition(id, input),
    onSuccess: (res, { input }) => {
      qc.invalidateQueries({ queryKey: ["recruitment-applications"] });
      if (res?.employee_id) {
        qc.invalidateQueries({ queryKey: ["recruitment-onboarding"] });
        qc.invalidateQueries({ queryKey: ["employees"] });
      }
      toast.success(
        input.status === "rejected"
          ? "Application rejected"
          : res?.employee_id
            ? "Candidate hired: employee record created and onboarding started"
            : `Moved to ${stageLabel(input.status)}`,
      );
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to move the application")),
  });
}

const onboarding = makeResourceHooks<Onboarding>("recruitment-onboarding", recruitmentApi.onboarding, "Onboarding");
export const useOnboarding = onboarding.useList;
export const useSaveOnboarding = onboarding.useSave;
export const useDeleteOnboarding = onboarding.useRemove;
// erp-api starts onboarding via POST /onboarding (create), so this is an alias.
export const useStartOnboarding = onboarding.useSave;

const TASKS_KEY = ["recruitment-onboarding", "tasks"] as const;

/** Checklist tasks for one onboarding (GET /onboarding/{id}/tasks). */
export function useOnboardingTasks(onboardingId: string | number | null) {
  return useQuery({
    queryKey: [...TASKS_KEY, onboardingId],
    queryFn: () => recruitmentApi.onboarding.listTasks(onboardingId!),
    enabled: !!onboardingId,
  });
}

/** Toggle a checklist task done/undone; refreshes tasks + the onboarding list (status rolls up). */
export function useCompleteOnboardingTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, done }: { taskId: string | number; done: boolean }) =>
      recruitmentApi.onboarding.completeTask(taskId, done),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recruitment-onboarding"] });
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to update task")),
  });
}

/** Set a task's assignee / due date. */
export function useUpdateOnboardingTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string | number; data: { assigned_to?: string; due_date?: string } }) =>
      recruitmentApi.onboarding.updateTask(taskId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TASKS_KEY });
      toast.success("Task updated");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to update task")),
  });
}

/** Add a custom checklist item to an onboarding. */
export function useAddOnboardingTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ onboardingId, data }: { onboardingId: string | number; data: { category?: string; title: string } }) =>
      recruitmentApi.onboarding.addTask(onboardingId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TASKS_KEY });
      toast.success("Task added");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to add task")),
  });
}
