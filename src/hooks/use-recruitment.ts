"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  recruitmentApi,
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

/** Advance an application to the next pipeline stage (erp-api /transition). */
export function useAdvanceApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arg: number | string | { id: number | string; stage?: string }) => {
      const id = typeof arg === "object" ? arg.id : arg;
      const stage = typeof arg === "object" ? arg.stage : undefined;
      return recruitmentApi.applications.advance(id, stage);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recruitment-applications"] });
      toast.success("Application advanced");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to advance application")),
  });
}

export function useRejectApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number | string; reason?: string }) =>
      recruitmentApi.applications.reject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recruitment-applications"] });
      toast.success("Application rejected");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to reject application")),
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
