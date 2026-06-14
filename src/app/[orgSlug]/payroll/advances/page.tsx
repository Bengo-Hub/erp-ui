"use client";

import { useAdvances, useDeleteAdvance, useSaveAdvance } from "@/hooks/use-payroll";

import { PayRecordManager } from "../_pay-record-manager";

export default function AdvancesPage() {
  return (
    <PayRecordManager
      title="Salary Advances"
      subtitle="Advance payments against future salary"
      entityLabel="Advance"
      hooks={{ list: useAdvances, save: useSaveAdvance, remove: useDeleteAdvance }}
      perms={{ add: "add_advances", change: "change_advances", delete: "delete_advances" }}
    />
  );
}
