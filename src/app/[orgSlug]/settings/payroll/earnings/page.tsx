"use client";

import { useDeleteEarning, useEarnings, useSaveEarning } from "@/hooks/use-payroll-settings";

import { PayComponentManager } from "../_component-manager";

export default function EarningsPage() {
  return (
    <PayComponentManager
      tabKey="earnings"
      entityLabel="Earning"
      hooks={{ list: useEarnings, save: useSaveEarning, remove: useDeleteEarning }}
    />
  );
}
