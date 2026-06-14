"use client";

import { useDeleteLossDamage, useLossDamages, useSaveLossDamage } from "@/hooks/use-payroll";

import { PayRecordManager } from "../_pay-record-manager";

export default function LossesDamagesPage() {
  return (
    <PayRecordManager
      title="Losses & Damages"
      subtitle="Recoverable losses and damages charged to employees"
      entityLabel="Record"
      hooks={{ list: useLossDamages, save: useSaveLossDamage, remove: useDeleteLossDamage }}
      perms={{
        add: "add_lossesanddamages",
        change: "change_lossesanddamages",
        delete: "delete_lossesanddamages",
      }}
    />
  );
}
