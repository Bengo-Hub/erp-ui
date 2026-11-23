"use client";

import { Banknote, Layers, Receipt, Timer } from "lucide-react";

import { StatTile } from "@/components/ui/stat-tile";
import { useMoney } from "@/hooks/use-money";
import { type AttendanceAnalytics } from "@/lib/api/attendance-analytics";
import { type HrmDashboard } from "@/lib/api/analytics";
import { formatNumber } from "@/lib/format";

/**
 * This month's money-relevant totals: overtime hours and piece output for everyone with HR or
 * management access, payroll cost for management only.
 */
export function MonthFigures({
  attendance,
  hrm,
  showPayroll,
  isLoading,
}: {
  attendance: AttendanceAnalytics | null | undefined;
  hrm: HrmDashboard | undefined;
  showPayroll: boolean;
  isLoading: boolean;
}) {
  const { format } = useMoney();
  const pay = hrm?.payroll_metrics;
  const dash = (v: string) => (isLoading ? "…" : v);
  const overtime = attendance?.overtime_hours_month;
  const pieces = attendance?.piece_output_month;

  return (
    <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
      <StatTile
        label="Overtime this month"
        value={dash(overtime != null ? `${formatNumber(overtime, 1)} h` : "—")}
        icon={Timer}
        hint="Approved and recorded hours"
      />
      <StatTile
        label="Piece output this month"
        value={dash(pieces ? formatNumber(pieces.quantity, 0) : "—")}
        icon={Layers}
        hint={pieces && showPayroll ? `Worth ${format(pieces.amount)}` : "Accepted units after QC"}
      />
      {showPayroll && (
        <>
          <StatTile
            label="Payroll, net"
            value={dash(format(pay?.total_net_pay))}
            icon={Banknote}
            hint={pay?.month ? `Payroll ${pay.month}` : "Latest payroll"}
          />
          <StatTile
            label="Payroll, gross"
            value={dash(format(pay?.total_gross_pay))}
            icon={Receipt}
            hint={pay?.month ? `Payroll ${pay.month}` : "Latest payroll"}
          />
        </>
      )}
    </div>
  );
}
