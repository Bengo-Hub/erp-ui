"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  appraisalApi,
  type AppraisalCycle,
  type AppraisalQuestion,
  type AppraisalTemplate,
  type Goal,
} from "@/lib/api/appraisals";
import { type ListParams } from "@/lib/api/drf";
import { extractApiError } from "@/lib/api/error";
import { makeActionHook, makeResourceHooks } from "@/hooks/use-crud-resource";

// ---- Cycles ----
const cycles = makeResourceHooks<AppraisalCycle>("appraisal-cycles", appraisalApi.cycles, "Cycle");
export const useAppraisalCycles = cycles.useList;
export const useAppraisalCycle = cycles.useDetail;
export const useSaveAppraisalCycle = cycles.useSave;
export const useDeleteAppraisalCycle = cycles.useRemove;
export const useActivateCycle = makeActionHook("appraisal-cycles", (id) => appraisalApi.cycles.activate(id), "Cycle activated", "Failed to activate cycle");
export const useCloseCycle = makeActionHook("appraisal-cycles", (id) => appraisalApi.cycles.close(id), "Cycle closed", "Failed to close cycle");
export const useReopenCycle = makeActionHook("appraisal-cycles", (id) => appraisalApi.cycles.reopen(id), "Cycle reopened", "Failed to reopen cycle");

// ---- Templates ----
const templates = makeResourceHooks<AppraisalTemplate>("appraisal-templates", appraisalApi.templates, "Template");
export const useAppraisalTemplates = templates.useList;
export const useAppraisalTemplate = templates.useDetail;
export const useSaveAppraisalTemplate = templates.useSave;
export const useDeleteAppraisalTemplate = templates.useRemove;

// ---- Questions ----
const questions = makeResourceHooks<AppraisalQuestion>("appraisal-questions", appraisalApi.questions, "Question");
export const useAppraisalQuestions = questions.useList;
export const useSaveAppraisalQuestion = questions.useSave;
export const useDeleteAppraisalQuestion = questions.useRemove;

// ---- Goals ----
const goals = makeResourceHooks<Goal>("appraisal-goals", appraisalApi.goals, "Goal");
export const useGoals = goals.useList;
export const useGoal = goals.useDetail;
export const useSaveGoal = goals.useSave;
export const useDeleteGoal = goals.useRemove;

export function useUpdateGoalProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, progress, note }: { id: number; progress: number | string; note?: string }) =>
      appraisalApi.goals.updateProgress(id, { progress, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appraisal-goals"] });
      toast.success("Progress updated");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to update progress")),
  });
}

// ---- Appraisals (main) ----
const KEY = "appraisals";

export function useAppraisals(params?: ListParams) {
  return useQuery({
    queryKey: [KEY, "list", params ?? {}],
    queryFn: () => appraisalApi.appraisals.list(params),
  });
}

export function useAppraisal(id: number | string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => appraisalApi.appraisals.get(id!),
    enabled: !!id,
  });
}

export function useSaveAppraisal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Record<string, unknown> }) =>
      id ? appraisalApi.appraisals.update(id, data) : appraisalApi.appraisals.create(data),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success(v.id ? "Appraisal updated" : "Appraisal created");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save appraisal")),
  });
}

export function useDeleteAppraisal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => appraisalApi.appraisals.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success("Appraisal deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to delete appraisal")),
  });
}

export const useSubmitAppraisal = makeActionHook(KEY, (id) => appraisalApi.appraisals.submit(id), "Appraisal submitted", "Failed to submit appraisal");
export const useApproveAppraisal = makeActionHook(KEY, (id) => appraisalApi.appraisals.approve(id), "Appraisal finalized", "Failed to finalize appraisal");
export const useReopenAppraisal = makeActionHook(KEY, (id) => appraisalApi.appraisals.reopen(id), "Appraisal reopened", "Failed to reopen appraisal");

export function useRejectAppraisal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      appraisalApi.appraisals.reject(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success("Appraisal rejected");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to reject appraisal")),
  });
}

// ---- Responses ----
export function useAppraisalResponses(appraisalId: number | string | undefined) {
  return useQuery({
    queryKey: ["appraisal-responses", appraisalId],
    queryFn: () => appraisalApi.listResponses(appraisalId!),
    enabled: !!appraisalId,
  });
}

export function useSaveResponses() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => appraisalApi.createResponses(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appraisal-responses"] });
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success("Responses saved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save responses")),
  });
}
