"use client";

import { FileBarChart } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Card } from "@/components/ui/base";
import { PageHeader } from "@/components/ui/page-header";
import { REPORTS } from "@/lib/reports-config";

export default function ReportsHubPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Reports"
        subtitle="Statutory & payroll reports — KRA, NSSF, NHIF/SHA, NITA and more."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Link key={r.key} href={`/${orgSlug}/reports/${r.key}`}>
            <Card className="flex h-full items-start gap-3 p-4 transition-colors hover:bg-accent/5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileBarChart className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{r.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.description}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
