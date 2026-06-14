"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  recruitmentApi,
  type Candidate,
  type JobApplication,
  type JobPosting,
  type Onboarding,
} from "@/lib/api/recruitment";
import { extractApiError } from "@/lib/api/error";
import { makeActionHook, makeResourceHooks } from "@/hooks/use-crud-resource";

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
export const useAdvanceApplication = makeActionHook(
  "recruitment-applications",
  (id) => recruitmentApi.applications.advance(id),
  "Application advanced",
  "Failed to advance application",
);

export function useRejectApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      recruitmentApi.applications.reject(id, reason),
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
export const useStartOnboarding = makeActionHook(
  "recruitment-onboarding",
  (id) => recruitmentApi.onboarding.start(id),
  "Onboarding started",
  "Failed to start onboarding",
);
