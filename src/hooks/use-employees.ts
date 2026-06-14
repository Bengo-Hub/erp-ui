"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  employeesApi,
  type Employee,
  type EmployeeBankAccount,
  type EmployeeNextOfKin,
  type EmployeeSalaryDetail,
} from "@/lib/api/employees";
import { type ListParams } from "@/lib/api/drf";
import { extractApiError } from "@/lib/api/error";

const KEY = "employees";

export function useEmployees(params: ListParams) {
  return useQuery({
    queryKey: [KEY, "list", params],
    queryFn: () => employeesApi.list(params),
  });
}

export function useEmployee(id: number | string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => employeesApi.get(id!),
    enabled: !!id,
  });
}

export function useSaveEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number | string; data: Partial<Employee> }) =>
      id ? employeesApi.update(id, data) : employeesApi.create(data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success(vars.id ? "Employee updated" : "Employee created");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save employee")),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => employeesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success("Employee deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to delete employee")),
  });
}

export function useImportEmployees() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => employeesApi.importEmployees(file),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success(`Imported ${res?.created ?? ""} employees`.trim());
    },
    onError: (e) => toast.error(extractApiError(e, "Import failed")),
  });
}

// ---- Bank accounts ----
export function useEmployeeBankAccounts(employeeId: number | string | undefined) {
  return useQuery({
    queryKey: [KEY, "bank", employeeId],
    queryFn: () => employeesApi.listBankAccounts(employeeId!),
    enabled: !!employeeId,
  });
}

export function useSaveBankAccount(employeeId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Partial<EmployeeBankAccount> }) =>
      id ? employeesApi.updateBankAccount(id, data) : employeesApi.addBankAccount(employeeId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "bank", employeeId] });
      toast.success("Bank account saved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save bank account")),
  });
}

export function useDeleteBankAccount(employeeId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => employeesApi.removeBankAccount(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "bank", employeeId] });
      toast.success("Bank account removed");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to remove bank account")),
  });
}

// ---- Next of kin ----
export function useEmployeeNextOfKin(employeeId: number | string | undefined) {
  return useQuery({
    queryKey: [KEY, "kin", employeeId],
    queryFn: () => employeesApi.listNextOfKin(employeeId!),
    enabled: !!employeeId,
  });
}

export function useSaveNextOfKin(employeeId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Partial<EmployeeNextOfKin> }) =>
      id ? employeesApi.updateNextOfKin(id, data) : employeesApi.addNextOfKin(employeeId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "kin", employeeId] });
      toast.success("Next of kin saved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save next of kin")),
  });
}

export function useDeleteNextOfKin(employeeId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => employeesApi.removeNextOfKin(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "kin", employeeId] });
      toast.success("Next of kin removed");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to remove next of kin")),
  });
}

// ---- Salary details ----
export function useEmployeeSalary(employeeId: number | string | undefined) {
  return useQuery({
    queryKey: [KEY, "salary", employeeId],
    queryFn: () => employeesApi.getSalaryDetails(employeeId!),
    enabled: !!employeeId,
  });
}

export function useSaveSalary(employeeId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EmployeeSalaryDetail>) => employeesApi.upsertSalary(employeeId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "salary", employeeId] });
      qc.invalidateQueries({ queryKey: [KEY, "detail", employeeId] });
      toast.success("Salary details saved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save salary details")),
  });
}
