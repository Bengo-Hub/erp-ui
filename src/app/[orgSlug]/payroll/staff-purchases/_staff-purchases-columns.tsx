import { type DataTableColumn } from "@bengo-hub/shared-ui-lib/data-table";

export interface StaffPurchaseRow {
  employee_id: string;
  employee_number: string;
  open_count: number;
  principal: string;
  recovered: string;
  outstanding: string;
}

const money = (v: string) => `KES ${Number(v || 0).toLocaleString()}`;

/** Columns for the staff-purchases sync-status table (read-only, no actions). */
export function buildStaffPurchaseColumns(): DataTableColumn<StaffPurchaseRow>[] {
  return [
    {
      key: "employee_number",
      header: "Employee #",
      primary: true,
      cellClassName: "font-mono text-xs",
      render: (r) => r.employee_number || r.employee_id.slice(0, 8),
    },
    {
      key: "open_count",
      header: "Open",
      align: "center",
      accessor: (r) => r.open_count,
    },
    {
      key: "principal",
      header: "Principal",
      align: "right",
      accessor: (r) => r.principal,
      render: (r) => money(r.principal),
    },
    {
      key: "recovered",
      header: "Recovered",
      align: "right",
      accessor: (r) => r.recovered,
      render: (r) => <span className="text-emerald-600">{money(r.recovered)}</span>,
    },
    {
      key: "outstanding",
      header: "Outstanding",
      align: "right",
      accessor: (r) => r.outstanding,
      render: (r) => <span className="font-semibold">{money(r.outstanding)}</span>,
    },
  ];
}
