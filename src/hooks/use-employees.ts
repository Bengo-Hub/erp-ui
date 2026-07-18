"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  employeesApi,
  type Employee,
  type EmployeeBankAccount,
  type EmployeeDisciplinary,
  type EmployeeDocument,
  type EmployeeEducation,
  type EmployeeNextOfKin,
  type EmployeeSalaryDetail,
  type EmploymentHistory,
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
      const failed = res?.failed ?? 0;
      if (failed > 0) {
        toast.warning(`Imported ${res?.created ?? 0}, ${failed} failed — see details`);
      } else {
        toast.success(`Imported ${res?.created ?? 0} employees`);
      }
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

// ---- Education ----
export function useEmployeeEducation(employeeId: number | string | undefined) {
  return useQuery({
    queryKey: [KEY, "education", employeeId],
    queryFn: () => employeesApi.listEducation(employeeId!),
    enabled: !!employeeId,
  });
}
export function useSaveEducation(employeeId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string | number; data: Partial<EmployeeEducation> }) =>
      id ? employeesApi.updateEducation(id, data) : employeesApi.addEducation(employeeId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "education", employeeId] });
      toast.success("Education saved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save education")),
  });
}
export function useDeleteEducation(employeeId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => employeesApi.removeEducation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "education", employeeId] });
      toast.success("Education removed");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to remove education")),
  });
}

// ---- Employment history ----
export function useEmployeeEmployment(employeeId: number | string | undefined) {
  return useQuery({
    queryKey: [KEY, "employment", employeeId],
    queryFn: () => employeesApi.listEmployment(employeeId!),
    enabled: !!employeeId,
  });
}
export function useSaveEmployment(employeeId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string | number; data: Partial<EmploymentHistory> }) =>
      id ? employeesApi.updateEmployment(id, data) : employeesApi.addEmployment(employeeId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "employment", employeeId] });
      toast.success("Employment record saved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save employment record")),
  });
}
export function useDeleteEmployment(employeeId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => employeesApi.removeEmployment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "employment", employeeId] });
      toast.success("Employment record removed");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to remove employment record")),
  });
}

// ---- Disciplinary ----
export function useEmployeeDisciplinary(employeeId: number | string | undefined) {
  return useQuery({
    queryKey: [KEY, "disciplinary", employeeId],
    queryFn: () => employeesApi.listDisciplinary(employeeId!),
    enabled: !!employeeId,
  });
}
export function useSaveDisciplinary(employeeId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string | number; data: Partial<EmployeeDisciplinary> }) =>
      id ? employeesApi.updateDisciplinary(id, data) : employeesApi.addDisciplinary(employeeId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "disciplinary", employeeId] });
      toast.success("Disciplinary record saved");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to save disciplinary record")),
  });
}
export function useDeleteDisciplinary(employeeId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => employeesApi.removeDisciplinary(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "disciplinary", employeeId] });
      toast.success("Disciplinary record removed");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to remove disciplinary record")),
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

// ---- Documents ----
export function useEmployeeDocuments(employeeId: number | string | undefined) {
  return useQuery({
    queryKey: [KEY, "documents", employeeId],
    queryFn: () => employeesApi.listDocuments(employeeId!),
    enabled: !!employeeId,
  });
}

export function useUploadDocument(employeeId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { file: File; title: string; document_type: string }) =>
      employeesApi.uploadDocument(employeeId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "documents", employeeId] });
      toast.success("Document uploaded");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to upload document")),
  });
}

// ---- Employment contract ----
export function useContractTerms(
  employeeId: number | string | undefined,
  type: string | undefined,
) {
  return useQuery({
    queryKey: [KEY, "contract-terms", employeeId, type],
    queryFn: () => employeesApi.getContractTerms(employeeId!, type!),
    enabled: !!employeeId && !!type,
  });
}

export function useSaveContractTerms(employeeId: number | string) {
  return useMutation({
    mutationFn: (termsHtml: string) => employeesApi.saveContractTerms(employeeId, termsHtml),
    onSuccess: () => toast.success("Contract terms saved"),
    onError: (e) => toast.error(extractApiError(e, "Failed to save contract terms")),
  });
}

export function useGenerateContract(employeeId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => employeesApi.generateContract(employeeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "documents", employeeId] });
      toast.success("Contract generated and attached to documents");
    },
    onError: (e) => toast.error(extractApiError(e, "Failed to generate contract")),
  });
}

export type { EmployeeDocument };
