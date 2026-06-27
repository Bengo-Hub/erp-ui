"use client";

import {
  useDeleteLossDamage,
  useLossDamages,
  useSaveLossDamage,
  useSetLossDamageApproval,
} from "@/hooks/use-payroll";

import { PayRecordManager } from "../_pay-record-manager";

export default function LossesDamagesPage() {
  return (
    <PayRecordManager
      title="Losses & Damages"
      subtitle="Recoverable losses and damages charged to employees, recovered over installments"
      entityLabel="Record"
      hooks={{
        list: useLossDamages,
        save: useSaveLossDamage,
        remove: useDeleteLossDamage,
        setApproval: useSetLossDamageApproval,
      }}
      perms={{
        add: "add_lossesanddamages",
        change: "change_lossesanddamages",
        delete: "delete_lossesanddamages",
      }}
    />
  );
}
