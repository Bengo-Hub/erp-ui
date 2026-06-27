"use client";

import {
  useAdvances,
  useDeleteAdvance,
  useSaveAdvance,
  useSetAdvanceApproval,
} from "@/hooks/use-payroll";

import { PayRecordManager } from "../_pay-record-manager";

export default function AdvancesPage() {
  return (
    <PayRecordManager
      title="Salary Advances"
      subtitle="Advance payments against future salary, recovered over one or more installments"
      entityLabel="Advance"
      hooks={{
        list: useAdvances,
        save: useSaveAdvance,
        remove: useDeleteAdvance,
        setApproval: useSetAdvanceApproval,
      }}
      perms={{ add: "add_advances", change: "change_advances", delete: "delete_advances" }}
    />
  );
}
