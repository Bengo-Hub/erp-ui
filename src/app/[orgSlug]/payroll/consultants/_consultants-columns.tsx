import { BadgeCheck, FileText, Trash2 } from "lucide-react";

import { type DataTableColumn } from "@bengo-hub/shared-ui-lib/data-table";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Badge, Button } from "@/components/ui/base";
import { type ConsultantVoucher } from "@/lib/api/payroll";
import { formatMoney } from "@/lib/utils";

function statusBadge(s?: string) {
  const v = (s || "draft").toLowerCase();
  return (
    <Badge variant={v === "paid" ? "success" : v === "approved" ? "success" : v === "pending" ? "default" : "secondary"}>
      {s || "Draft"}
    </Badge>
  );
}

export function buildConsultantColumns({
  selected,
  onToggleSelect,
  onPreview,
  onApprove,
  approvePending,
  onDelete,
}: {
  selected: Record<string, boolean>;
  onToggleSelect: (id: string) => void;
  onPreview: (v: ConsultantVoucher) => void;
  onApprove: (v: ConsultantVoucher) => void;
  approvePending: boolean;
  onDelete: (v: ConsultantVoucher) => void;
}): DataTableColumn<ConsultantVoucher>[] {
  return [
    {
      key: "select",
      header: "",
      mobileAction: true,
      cellClassName: "w-10",
      render: (v) => {
        const id = String(v.id);
        return (
          <input
            type="checkbox"
            checked={!!selected[id]}
            onChange={() => onToggleSelect(id)}
            aria-label="Select voucher"
          />
        );
      },
    },
    {
      key: "doc_number",
      header: "Doc No.",
      cellClassName: "text-muted-foreground",
      accessor: (v) => v.doc_number,
      render: (v) => v.doc_number || "—",
    },
    {
      key: "name",
      header: "Name",
      primary: true,
      cellClassName: "font-medium",
      accessor: (v) => v.name || v.employee_name,
      render: (v) => v.name || v.employee_name || "—",
    },
    {
      key: "title",
      header: "Title",
      cellClassName: "text-muted-foreground",
      accessor: (v) => v.title,
      render: (v) => v.title || "—",
    },
    {
      key: "wht_amount",
      header: "WHT",
      align: "right",
      cellClassName: "text-muted-foreground",
      accessor: (v) => v.wht_amount,
      render: (v) => formatMoney(v.wht_amount),
    },
    {
      key: "net_amount",
      header: "Net Amount",
      align: "right",
      cellClassName: "font-semibold",
      accessor: (v) => v.net_amount,
      render: (v) => formatMoney(v.net_amount),
    },
    {
      key: "email_status",
      header: "Email",
      align: "center",
      cellClassName: "text-xs text-muted-foreground",
      accessor: (v) => v.email_status,
      render: (v) => v.email_status || "Draft",
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      accessor: (v) => v.status,
      render: (v) => statusBadge(v.status),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      mobileAction: true,
      render: (v) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => onPreview(v)} title="Voucher PDF">
            <FileText className="size-4" />
          </Button>
          {v.status !== "approved" && v.status !== "paid" && (
            <PermissionGate permission={["hrm.payroll.manage"]}>
              <Button size="sm" variant="ghost" disabled={approvePending} onClick={() => onApprove(v)} title="Approve + pay">
                <BadgeCheck className="size-4 text-green-600" />
              </Button>
            </PermissionGate>
          )}
          <Button size="sm" variant="ghost" onClick={() => onDelete(v)} title="Delete">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];
}
