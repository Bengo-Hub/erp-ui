"use client";

import { CalendarClock, Receipt, TrendingUp, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/base";
import { useBranding } from "@/providers/branding-provider";
import { useAuthStore } from "@/store/auth";

const STATS = [
  { label: "Employees", value: "—", icon: Users, hint: "Headcount" },
  { label: "Pending Leave", value: "—", icon: CalendarClock, hint: "Awaiting approval" },
  { label: "Payroll Run", value: "—", icon: Receipt, hint: "Current period" },
  { label: "Headcount Δ", value: "—", icon: TrendingUp, hint: "Month over month" },
];

/** Executive dashboard shell. Live widgets land in later sprints. */
export default function DashboardPage() {
  const { getServiceTitle } = useBranding();
  const user = useAuthStore((s) => s.user);
  const name = user?.fullName?.split(" ")[0] || "there";

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Welcome back, {name}</h1>
        <p className="text-sm text-muted-foreground mt-1">{getServiceTitle("HR")} dashboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {/* TODO(sprint-4): executive/HRM/ICT dashboards with recharts widgets. */}
            Dashboard widgets are coming in a later sprint. The shell, auth, tenant
            branding and navigation are live.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
