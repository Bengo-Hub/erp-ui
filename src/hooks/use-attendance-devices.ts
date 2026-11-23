"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  accessEventsApi,
  COMMAND_LABELS,
  devicePinApi,
  devicesApi,
  punchesApi,
  type AccessFilters,
  type DeviceCommandType,
  type DeviceInput,
  type PunchFilters,
} from "@/lib/api/attendance-devices";
import { extractApiError } from "@/lib/api/error";

const DEVICES = ["attendance-devices"];

/** Devices refresh every 30 s so the online badge and last-seen time stay current. */
export function useDevices(params?: object) {
  return useQuery({
    queryKey: [...DEVICES, params ?? {}],
    queryFn: () => devicesApi.list(params),
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useSaveDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: DeviceInput }) =>
      id ? devicesApi.update(id, data) : devicesApi.create(data),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: DEVICES });
      toast.success(v.id ? "Device updated" : "Device registered");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not save the device")),
  });
}

export function useDeleteDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => devicesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DEVICES });
      toast.success("Device removed");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not remove the device")),
  });
}

/** Command log for one device; polls while any command is still queued or sent. */
export function useDeviceCommands(deviceId: string | null) {
  return useQuery({
    queryKey: [...DEVICES, deviceId, "commands"],
    queryFn: () => devicesApi.commands(deviceId as string, { limit: 50 }),
    enabled: !!deviceId,
    refetchInterval: (q) =>
      (q.state.data?.data ?? []).some((c) => c.status === "queued" || c.status === "sent") ? 5_000 : false,
  });
}

export function useSendDeviceCommand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: DeviceCommandType }) => devicesApi.sendCommand(id, type),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: [...DEVICES, v.id, "commands"] });
      toast.success(`${COMMAND_LABELS[v.type]} queued. The device picks it up on its next check-in.`);
    },
    onError: (e) => toast.error(extractApiError(e, "Could not queue the command")),
  });
}

export function usePunches(filters: PunchFilters) {
  return useQuery({
    queryKey: ["attendance-punches", filters],
    queryFn: () => punchesApi.list(filters),
    placeholderData: (prev) => prev,
  });
}

export function useAccessEvents(filters: AccessFilters) {
  return useQuery({
    queryKey: ["attendance-access-events", filters],
    queryFn: () => accessEventsApi.list(filters),
    placeholderData: (prev) => prev,
  });
}

export function useSetDevicePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, pin }: { employeeId: string | number; pin: string }) => devicePinApi.set(employeeId, pin),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Device PIN saved. Sync users on the devices to load it.");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not save the device PIN")),
  });
}
