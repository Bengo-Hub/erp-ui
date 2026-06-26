"use client";

/**
 * BankVerifyFields — bank dropdown + account number + Verify (auto-fills the account holder name)
 * backed by erp-api's /hrm/banks proxy → treasury S2S Paystack. Reuse on bank forms so account
 * numbers are verified before saving (accurate payroll payouts).
 */

import { Button } from "@/components/ui/base";
import { Field, Input, Select } from "@/components/ui/form";
import { banksApi, type BankOption } from "@/lib/api/banks";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface Props {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  onChange: (patch: { bank_name?: string; bank_code?: string; account_number?: string; account_name?: string }) => void;
  country?: string;
}

export function BankVerifyFields({ bankName, bankCode, accountNumber, accountName, onChange, country = "kenya" }: Props) {
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingBanks(true);
    banksApi
      .list(country)
      .then((res) => {
        if (cancelled) return;
        const arr = (res.banks as BankOption[]) ?? (res.data as BankOption[]) ?? [];
        setBanks(arr ?? []);
      })
      .catch(() => !cancelled && setBanks([]))
      .finally(() => !cancelled && setLoadingBanks(false));
    return () => {
      cancelled = true;
    };
  }, [country]);

  // Resolve a saved bank_name from a saved bank_code once banks load (edit mode).
  const selected = useMemo(() => banks.find((b) => b.code === bankCode), [banks, bankCode]);
  useEffect(() => {
    if (selected && selected.name !== bankName) onChange({ bank_name: selected.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  async function verify() {
    setNote(null);
    setVerified(false);
    setVerifying(true);
    try {
      const res = await banksApi.resolve(accountNumber, bankCode);
      const payload = (res.data as Record<string, unknown>) ?? res;
      if (payload?.resolvable === false || !payload?.account_name) {
        setNote((payload?.message as string) || "Could not auto-verify — check the details.");
        return;
      }
      setVerified(true);
      onChange({ account_name: payload.account_name as string });
    } catch {
      setNote("Verification failed — check the bank and account number.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <>
      <Field label="Bank">
        {loadingBanks ? (
          <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading banks…
          </div>
        ) : (
          <Select
            value={bankCode}
            onChange={(e) => {
              const b = banks.find((x) => x.code === e.target.value);
              setVerified(false);
              setNote(null);
              onChange({ bank_code: e.target.value, bank_name: b?.name ?? "" });
            }}
          >
            <option value="">Select bank…</option>
            {banks.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Account Number">
        <div className="flex gap-2">
          <Input
            className="flex-1"
            value={accountNumber}
            onChange={(e) => {
              setVerified(false);
              setNote(null);
              onChange({ account_number: e.target.value });
            }}
          />
          <Button type="button" variant="secondary" size="sm" disabled={!bankCode || !accountNumber || verifying} onClick={verify}>
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
          </Button>
        </div>
        {note && <p className="mt-1 text-xs text-amber-600">{note}</p>}
      </Field>
      <Field label="Account Name">
        <div className="relative">
          <Input value={accountName} onChange={(e) => onChange({ account_name: e.target.value })} />
          {verified && <CheckCircle2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-green-600" />}
        </div>
        {verified && <p className="mt-1 text-xs font-medium text-green-600">✓ {accountName}</p>}
      </Field>
    </>
  );
}
