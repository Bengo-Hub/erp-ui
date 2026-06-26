"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { extractApiError } from "@/lib/api/error";
import {
  brandingSettingsApi,
  businessSequencesApi,
  businessSettingsApi,
  pickSettings,
  regionalSettingsApi,
  type BusinessSettings,
  type DocumentSequence,
  type RegionalSettings,
} from "@/lib/api/settings";

/* ---- Regional (currency / time / locale) ---- */
export function useRegionalSettings() {
  const q = useQuery({ queryKey: ["settings", "regional"], queryFn: regionalSettingsApi.get });
  return { ...q, settings: pickSettings<RegionalSettings>(q.data) };
}

export function useSaveRegionalSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Partial<RegionalSettings> }) =>
      regionalSettingsApi.save(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings", "regional"] });
      toast.success("Regional settings saved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save regional settings")),
  });
}

/* ---- Business / company ---- */
export function useBusinessSettings() {
  const q = useQuery({ queryKey: ["settings", "business"], queryFn: businessSettingsApi.get });
  return { ...q, settings: pickSettings<BusinessSettings>(q.data) };
}

export function useSaveBusinessSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Partial<BusinessSettings> }) =>
      businessSettingsApi.save(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings", "business"] });
      toast.success("Company settings saved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save company settings")),
  });
}

/* ---- Document numbering sequences ---- */
export function useDocumentSequences() {
  return useQuery({ queryKey: ["settings", "sequences"], queryFn: businessSequencesApi.list });
}

export function useSaveDocumentSequence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DocumentSequence>) => businessSequencesApi.upsert(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings", "sequences"] });
      toast.success("Numbering sequence saved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save numbering sequence")),
  });
}

/* ---- Branding (auth-api is SoT; read-only here) ---- */
export function useBrandingSettings() {
  return useQuery({
    queryKey: ["settings", "branding"],
    queryFn: brandingSettingsApi.get,
    retry: false,
  });
}
