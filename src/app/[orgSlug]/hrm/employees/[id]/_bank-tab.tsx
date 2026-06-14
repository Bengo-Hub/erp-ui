"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { PermissionGate } from "@/components/auth/permission-gate";
import { Badge, Button, Card } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Switch } from "@/components/ui/form";
import {
  useDeleteBankAccount,
  useEmployeeBankAccounts,
  useSaveBankAccount,
} from "@/hooks/use-employees";
import { normalizeList } from "@/lib/api/drf";
import { type EmployeeBankAccount } from "@/lib/api/employees";

type FormValues = Omit<EmployeeBankAccount, "id" | "employee" | "is_primary">;

export function BankTab({ employeeId }: { employeeId: number }) {
  const { data, isLoading, error, refetch } = useEmployeeBankAccounts(employeeId);
  const save = useSaveBankAccount(employeeId);
  const del = useDeleteBankAccount(employeeId);
  const accounts = normalizeList<EmployeeBankAccount>(data).results;

  const [editing, setEditing] = useState<EmployeeBankAccount | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const [toDelete, setToDelete] = useState<EmployeeBankAccount | null>(null);

  const { register, handleSubmit, reset } = useForm<FormValues>();

  const openCreate = () => {
    setEditing(null);
    setIsPrimary(false);
    reset({ bank_name: "", branch_name: "", account_number: "", account_name: "" });
    setDialogOpen(true);
  };
  const openEdit = (a: EmployeeBankAccount) => {
    setEditing(a);
    setIsPrimary(!!a.is_primary);
    reset({
      bank_name: a.bank_name,
      branch_name: a.branch_name,
      account_number: a.account_number,
      account_name: a.account_name,
    });
    setDialogOpen(true);
  };

  const onSubmit = (v: FormValues) => {
    save.mutate(
      { id: editing?.id, data: { ...v, is_primary: isPrimary } },
      { onSuccess: () => setDialogOpen(false) },
    );
  };

  const columns: Column<EmployeeBankAccount>[] = [
    {
      header: "Bank",
      cell: (a) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{a.bank_name || "—"}</span>
          {a.is_primary && <Badge variant="success">Primary</Badge>}
        </div>
      ),
    },
    { header: "Branch", cell: (a) => a.branch_name || "—" },
    { header: "Account No.", cell: (a) => a.account_number || "—" },
    { header: "Account Name", cell: (a) => a.account_name || "—" },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (a) => (
        <div className="flex justify-end gap-1">
          <PermissionGate permission="change_employee">
            <Button variant="ghost" size="icon" onClick={() => openEdit(a)} aria-label="Edit">
              <Pencil className="size-4" />
            </Button>
          </PermissionGate>
          <PermissionGate permission="delete_employee">
            <Button variant="ghost" size="icon" onClick={() => setToDelete(a)} aria-label="Delete">
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="text-sm font-bold text-foreground">Bank Accounts</h3>
        <PermissionGate permission="change_employee">
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 size-4" /> Add Account
          </Button>
        </PermissionGate>
      </div>

      <DataTable
        columns={columns}
        rows={accounts}
        rowKey={(a) => a.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        emptyTitle="No bank accounts"
        emptyDescription="Add a bank account for salary payments."
      />

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit Bank Account" : "Add Bank Account"}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bank Name">
            <Input {...register("bank_name")} />
          </Field>
          <Field label="Branch">
            <Input {...register("branch_name")} />
          </Field>
          <Field label="Account Number">
            <Input {...register("account_number")} />
          </Field>
          <Field label="Account Name">
            <Input {...register("account_name")} />
          </Field>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Switch checked={isPrimary} onChange={setIsPrimary} id="bank-primary" />
            <label htmlFor="bank-primary" className="text-sm text-foreground">
              Primary account (used for payroll disbursement)
            </label>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete bank account?"
        description="This action cannot be undone."
        destructive
        loading={del.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() =>
          toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })
        }
      />
    </Card>
  );
}
