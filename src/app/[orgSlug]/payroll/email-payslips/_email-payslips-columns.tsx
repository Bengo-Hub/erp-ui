import { type DataTableColumn } from "@bengo-hub/shared-ui-lib/data-table";
import { type Employee } from "@/lib/api/employees";
import { employeeName } from "@/lib/hrm";

export function buildEmailPayslipColumns({
  selected,
  onToggle,
  allChecked,
  onToggleAll,
}: {
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
  allChecked: boolean;
  onToggleAll: () => void;
}): DataTableColumn<Employee>[] {
  return [
    {
      key: "select",
      header: <input type="checkbox" checked={allChecked} onChange={onToggleAll} aria-label="Select all" />,
      mobileAction: true,
      cellClassName: "w-10",
      render: (e) => {
        const id = String(e.id);
        return (
          <input
            type="checkbox"
            checked={!!selected[id]}
            onChange={() => onToggle(id)}
            aria-label={`Select ${employeeName(e)}`}
          />
        );
      },
    },
    {
      key: "employee_number",
      header: "Staff No.",
      cellClassName: "text-muted-foreground",
      accessor: (e) => e.employee_number,
      render: (e) => e.employee_number || "—",
    },
    {
      key: "name",
      header: "Name",
      primary: true,
      cellClassName: "font-medium",
      accessor: (e) => employeeName(e),
    },
    {
      key: "email",
      header: "Email",
      cellClassName: "text-muted-foreground",
      accessor: (e) => e.email,
    },
  ];
}
