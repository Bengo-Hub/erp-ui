import { type DataTableColumn } from "@bengo-hub/shared-ui-lib/data-table";
import { type EmployeeImportRow } from "@/lib/api/employees";

/** Columns for the failed-rows table shown after a CSV employee import. */
export function buildImportResultColumns(): DataTableColumn<EmployeeImportRow>[] {
  return [
    {
      key: "row",
      header: "Row",
      accessor: (r) => r.row,
    },
    {
      key: "employee_number",
      header: "Employee #",
      primary: true,
      accessor: (r) => r.employee_number ?? r.email,
      render: (r) => r.employee_number || r.email || "—",
    },
    {
      key: "error",
      header: "Error",
      cellClassName: "text-destructive",
      accessor: (r) => r.error,
    },
  ];
}
