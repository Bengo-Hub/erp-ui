"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { extractApiError } from "@/lib/api/error";
import {
  pieceOutputsApi,
  pieceRatesApi,
  type OutputFilters,
  type PieceOutputInput,
  type PieceRateInput,
} from "@/lib/api/piece-rate";

const RATES = ["piece-rates"];
const OUTPUTS = ["piece-outputs"];

export function usePieceRates(params?: object) {
  return useQuery({ queryKey: [...RATES, params ?? {}], queryFn: () => pieceRatesApi.list(params), placeholderData: (p) => p });
}

export function useSavePieceRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: PieceRateInput }) =>
      id ? pieceRatesApi.update(id, data) : pieceRatesApi.create(data),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: RATES });
      toast.success(v.id ? "Piece rate updated" : "Piece rate added");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not save the piece rate")),
  });
}

export function useDeletePieceRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pieceRatesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RATES });
      toast.success("Piece rate deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not delete the piece rate")),
  });
}

export function usePieceOutputs(filters: OutputFilters) {
  return useQuery({
    queryKey: [...OUTPUTS, filters],
    queryFn: () => pieceOutputsApi.list(filters),
    placeholderData: (p) => p,
  });
}

/** Saves several entry rows one after another and reports how many went through. */
export function useSavePieceOutputs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: PieceOutputInput[]) => {
      const results = await Promise.allSettled(rows.map((r) => pieceOutputsApi.create(r)));
      const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
      return { saved: rows.length - failed.length, failed: failed.length, firstError: failed[0]?.reason as unknown };
    },
    onSuccess: ({ saved, failed, firstError }) => {
      qc.invalidateQueries({ queryKey: OUTPUTS });
      if (saved) toast.success(`${saved} output ${saved === 1 ? "line" : "lines"} saved`);
      if (failed) toast.error(`${failed} not saved: ${extractApiError(firstError, "check the rows and try again")}`);
    },
  });
}

export function useReviewPieceOutputs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, action }: { ids: string[]; action: "approve" | "reject" }) => pieceOutputsApi.review(ids, action),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: OUTPUTS });
      toast.success(`${v.ids.length} ${v.ids.length === 1 ? "line" : "lines"} ${v.action === "approve" ? "approved" : "rejected"}`);
    },
    onError: (e) => toast.error(extractApiError(e, "Could not record the review")),
  });
}
