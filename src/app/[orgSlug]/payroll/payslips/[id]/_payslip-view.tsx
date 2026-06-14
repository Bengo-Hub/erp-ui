"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/base";
import { type Payslip, type PayslipLine } from "@/lib/api/payroll";
import { formatDate, formatMoney } from "@/lib/utils";

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

function LineRows({ lines }: { lines?: PayslipLine[] }) {
  if (!lines?.length) return <p className="text-sm text-muted-foreground">None</p>;
  return (
    <div className="space-y-1.5">
      {lines.map((l, i) => (
        <div key={i} className="flex justify-between text-sm">
          <span className="text-muted-foreground">{l.name || l.label || "Item"}</span>
          <span className="font-medium text-foreground">{formatMoney(l.amount)}</span>
        </div>
      ))}
    </div>
  );
}

function StatRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={bold ? "text-sm font-semibold text-foreground" : "text-sm text-muted-foreground"}>
        {label}
      </span>
      <span className={bold ? "text-base font-bold text-foreground" : "text-sm font-medium text-foreground"}>
        {value}
      </span>
    </div>
  );
}

/** Printable payslip breakdown: gross / PAYE / NSSF / SHIF / housing / net. */
export function PayslipView({ payslip }: { payslip: Payslip }) {
  const statutory = [
    { label: "PAYE", value: payslip.paye },
    { label: "NSSF", value: payslip.nssf },
    { label: "SHIF / NHIF", value: payslip.shif ?? payslip.nhif },
    { label: "Housing Levy", value: payslip.housing_levy },
  ];
  const totalStatutory = statutory.reduce((a, s) => a + num(s.value), 0);

  return (
    <div className="space-y-4" id="payslip-printable">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {payslip.employee_name || "Employee"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {payslip.employee_number ? `${payslip.employee_number} · ` : ""}
              {payslip.payment_period ||
                payslip.pay_period ||
                payslip.period ||
                `${formatDate(payslip.from_date)} – ${formatDate(payslip.to_date)}`}
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Earnings
            </h4>
            <StatRow label="Basic Salary" value={formatMoney(payslip.basic_salary)} />
            <LineRows lines={payslip.earnings} />
            <LineRows lines={payslip.benefits} />
            <div className="my-2 border-t border-border" />
            <StatRow label="Gross Pay" value={formatMoney(payslip.gross_pay ?? payslip.total_earnings)} bold />
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Deductions
            </h4>
            {statutory.map((s) => (
              <StatRow key={s.label} label={s.label} value={formatMoney(s.value)} />
            ))}
            <LineRows lines={payslip.deductions} />
            <div className="my-2 border-t border-border" />
            <StatRow
              label="Total Deductions"
              value={formatMoney(payslip.total_deductions ?? totalStatutory)}
              bold
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between bg-primary/5">
          <span className="text-sm font-semibold text-foreground">Net Pay</span>
          <span className="text-2xl font-bold text-primary">{formatMoney(payslip.net_pay)}</span>
        </CardContent>
      </Card>
    </div>
  );
}
