import { Printer } from "lucide-react";

import { type DataTableColumn } from "@bengo-hub/shared-ui-lib/data-table";
import { IconButton } from "@/components/ui/tooltip";
import { type Payslip } from "@/lib/api/payroll";
import { formatMoney } from "@/lib/utils";

/** Columns for the per-period expanded list of individual employee payslips. */
export function buildPayslipLineColumns({
  StatusBadge,
  onPrint,
}: {
  StatusBadge: (props: { status: string }) => React.ReactElement;
  onPrint: (ps: Payslip) => void;
}): DataTableColumn<Payslip>[] {
  return [
    {
      key: "employee",
      header: "Employee",
      primary: true,
      render: (ps) => (
        <>
          <span className="font-medium text-foreground">{ps.employee_name || "Employee"}</span>
          {ps.employee_number ? (
            <span className="ml-2 text-xs text-muted-foreground">{ps.employee_number}</span>
          ) : null}
        </>
      ),
    },
    {
      key: "gross",
      header: "Gross",
      align: "right",
      cellClassName: "text-muted-foreground",
      accessor: (ps) => ps.gross_pay ?? ps.total_earnings,
      render: (ps) => formatMoney(ps.gross_pay ?? ps.total_earnings),
    },
    {
      key: "net_pay",
      header: "Net pay",
      align: "right",
      cellClassName: "font-medium",
      accessor: (ps) => ps.net_pay,
      render: (ps) => formatMoney(ps.net_pay),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (ps) => <StatusBadge status={ps.status ?? (ps.payment_status as string)} />,
    },
    {
      key: "print",
      header: "",
      align: "right",
      mobileAction: true,
      render: (ps) => (
        <IconButton label="Print payslip" onClick={() => onPrint(ps)}>
          <Printer className="size-4" />
        </IconButton>
      ),
    },
  ];
}
