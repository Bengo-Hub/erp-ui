"use client";

import { FileBarChart } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Card } from "@/components/ui/base";
import { PageHeader } from "@/components/ui/page-header";
import { REPORTS, reportAudience, type ReportAudience } from "@/lib/reports-config";

const GROUPS: { audience: ReportAudience; blurb: string }[] = [
  { audience: "Statutory", blurb: "KRA, NSSF, SHA, NITA and Housing Levy returns" },
  { audience: "Payroll", blurb: "Pay runs, bank schedules and variance" },
  { audience: "HR", blurb: "Attendance, absence, lateness and overtime" },
  { audience: "Security", blurb: "Door access and refused attempts" },
  { audience: "Quality control", blurb: "Piece output and QC rejects" },
  { audience: "IT", blurb: "Biometric device health" },
  { audience: "Management", blurb: "Department summaries" },
];

/** Every report, grouped by the department that reads it. */
export default function ReportsHubPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader title="Reports" subtitle="Statutory returns, payroll, attendance and security reports" />
      {GROUPS.map((g) => {
        const items = REPORTS.filter((r) => reportAudience(r) === g.audience);
        if (!items.length) return null;
        return (
          <section key={g.audience} aria-labelledby={`grp-${g.audience}`} className="space-y-3">
            <div>
              <h2 id={`grp-${g.audience}`} className="text-base font-semibold text-foreground">
                {g.audience}
              </h2>
              <p className="text-xs text-muted-foreground">{g.blurb}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((r) => (
                <Link key={r.key} href={`/${orgSlug}/reports/${r.key}`} className="rounded-xl focus-visible:outline-2 focus-visible:outline-ring">
                  <Card className="flex h-full items-start gap-3 p-4 transition-colors hover:bg-accent/5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileBarChart className="size-5" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{r.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{r.description}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
