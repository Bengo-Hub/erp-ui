"use client";

import { Eye, Pencil, Plus, Trash2, Upload, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { OutletFilter } from "@/components/outlet/outlet-filter";
import { Badge, Button } from "@/components/ui/base";
import { Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { IconButton } from "@/components/ui/tooltip";
import { useDebounce } from "@/hooks/use-debounce";
import { useDeleteEmployee, useEmployees } from "@/hooks/use-employees";
import { useDepartments } from "@/hooks/use-hrm-settings";
import { normalizeList } from "@/lib/api/drf";
import { type Employee } from "@/lib/api/employees";
import { employeeName, PAGE_SIZE, relationLabel } from "@/lib/hrm";
import { useOutletFilterStore } from "@/store/outlet-filter";

import { EmployeeFormDialog } from "./_employee-form-dialog";
import { GovernanceBadges } from "./_governance-badges";
import { ImportEmployeesDialog } from "./_import-dialog";

export default function EmployeesPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;
  const selectedOutlet = useOutletFilterStore((s) => s.selectedOutlet);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const del = useDeleteEmployee();
  const debouncedSearch = useDebounce(search);

  const queryParams = useMemo(
    () => ({
      page,
      page_size: PAGE_SIZE,
      search: debouncedSearch || undefined,
      department: department || undefined,
      employment_status: status || undefined,
      // outlet header is applied automatically by the OutletFilter; include id for safety.
      outlet: selectedOutlet?.id || undefined,
    }),
    [page, debouncedSearch, department, status, selectedOutlet],
  );

  const { data, isLoading, error, refetch } = useEmployees(queryParams);
  const { data: deptData } = useDepartments();
  const { results: employees, count } = normalizeList<Employee>(data);
  const departments = normalizeList(deptData).results;

  const columns: Column<Employee>[] = [
    {
      header: "Employee",
      cell: (e) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{employeeName(e)}</span>
          <span className="text-xs text-muted-foreground">
            {e.employee_number || e.email || "—"}
          </span>
        </div>
      ),
    },
    {
      header: "Job Title",
      cell: (e) => relationLabel(e.job_title, e.job_title_name),
    },
    {
      header: "Department",
      cell: (e) => relationLabel(e.department, e.department_name),
    },
    {
      header: "Type",
      cell: (e) => <span className="capitalize">{e.employment_type || "—"}</span>,
    },
    {
      header: "Status",
      cell: (e) => {
        const active = e.is_active ?? e.employment_status !== "terminated";
        return (
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant={active ? "success" : "secondary"}>
              {e.employment_status || (active ? "Active" : "Inactive")}
            </Badge>
            <GovernanceBadges employee={e} />
          </div>
        );
      },
    },
    {
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      cell: (e) => (
        <div className="flex items-center justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
          <IconButton label="View" onClick={() => router.push(`/${orgSlug}/hrm/employees/${e.id}`)}>
            <Eye className="size-4" />
          </IconButton>
          <PermissionGate permission="change_employee">
            <IconButton label="Edit" onClick={() => setEditEmployee(e)}>
              <Pencil className="size-4" />
            </IconButton>
          </PermissionGate>
          <PermissionGate permission="delete_employee">
            <IconButton label="Delete" onClick={() => setDeleteTarget(e)}>
              <Trash2 className="size-4 text-destructive" />
            </IconButton>
          </PermissionGate>
        </div>
      ),
    },
  ];

  // Reset to page 1 whenever a filter changes.
  const onFilter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Employees"
        subtitle="Directory of all staff across your outlets"
        actions={
          <>
            <PermissionGate permission="add_employee">
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                <Upload className="mr-1.5 size-4" /> Import
              </Button>
            </PermissionGate>
            <PermissionGate permission="add_employee">
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <Plus className="mr-1.5 size-4" /> Add Employee
              </Button>
            </PermissionGate>
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <SearchInput
            value={search}
            onChange={(v) => onFilter(() => setSearch(v))}
            placeholder="Search name, number, email…"
            className="min-w-[220px] flex-1"
          />
          <OutletFilter tenantSlug={orgSlug} />
          <Select
            value={department}
            onChange={(e) => onFilter(() => setDepartment(e.target.value))}
            className="w-auto min-w-[160px]"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(e) => onFilter(() => setStatus(e.target.value))}
            className="w-auto min-w-[140px]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="suspended">Suspended</option>
            <option value="terminated">Terminated</option>
          </Select>
        </div>

        <DataTable
          columns={columns}
          rows={employees}
          rowKey={(e) => e.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No employees found"
          emptyDescription="Try adjusting your filters, or add your first employee."
          emptyAction={
            <PermissionGate permission="add_employee">
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <Users className="mr-1.5 size-4" /> Add Employee
              </Button>
            </PermissionGate>
          }
          onRowClick={(e) => router.push(`/${orgSlug}/hrm/employees/${e.id}`)}
        />
        {employees.length > 0 && (
          <div className="border-t border-border">
            <Pagination page={page} pageSize={PAGE_SIZE} total={count} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <ImportEmployeesDialog open={importOpen} onClose={() => setImportOpen(false)} />
      <EmployeeFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(id) => router.push(`/${orgSlug}/hrm/employees/${id}`)}
      />
      <EmployeeFormDialog
        open={!!editEmployee}
        employee={editEmployee}
        onClose={() => setEditEmployee(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete employee?"
        description={`Remove ${deleteTarget ? employeeName(deleteTarget) : "this employee"}? This cannot be undone.`}
        confirmLabel="Delete"
        loading={del.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          del.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
      />

      <p className="text-center text-xs text-muted-foreground">
        Need to manage org structure?{" "}
        <Link href={`/${orgSlug}/settings/hrm/departments`} className="text-primary hover:underline">
          Departments, job titles & groups
        </Link>
      </p>
    </div>
  );
}
