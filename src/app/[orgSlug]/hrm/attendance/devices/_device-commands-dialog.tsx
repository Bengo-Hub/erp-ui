"use client";

import { DoorOpen, FileClock, Power, Trash2, Users, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { Badge, Button } from "@/components/ui/base";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { useDeviceCommands, useSendDeviceCommand } from "@/hooks/use-attendance-devices";
import {
  COMMAND_LABELS,
  type AttendanceDevice,
  type DeviceCommand,
  type DeviceCommandType,
} from "@/lib/api/attendance-devices";
import { formatDateTime } from "@/lib/format";

interface CommandDef {
  type: DeviceCommandType;
  icon: LucideIcon;
  confirm: string;
  destructive?: boolean;
  /** Door devices only. */
  acOnly?: boolean;
}

const COMMANDS: CommandDef[] = [
  { type: "sync_users", icon: Users, confirm: "Send every employee with a device PIN to this device? Names and PINs are updated on the terminal." },
  { type: "reload_logs", icon: FileClock, confirm: "Ask the device to upload all punches it holds again? Punches already received are skipped." },
  { type: "open_door", icon: DoorOpen, confirm: "Unlock the door on this device now?", acOnly: true },
  { type: "reboot", icon: Power, confirm: "Restart the device? It stops taking punches for about a minute." },
  {
    type: "clear_logs",
    icon: Trash2,
    destructive: true,
    confirm: "Delete the punch history stored on the device? Run Reload logs first so nothing is lost. The ERP copy is kept.",
  },
];

const STATUS_VARIANT = { queued: "secondary", sent: "default", done: "success", failed: "error" } as const;

/** Send a command to one device, with a confirmation, and follow its progress in the log. */
export function DeviceCommandsDialog({ device, onClose }: { device: AttendanceDevice | null; onClose: () => void }) {
  const { data, isLoading, error, refetch } = useDeviceCommands(device?.id ?? null);
  const send = useSendDeviceCommand();
  const [pending, setPending] = useState<CommandDef | null>(null);
  const rows = data?.data ?? [];

  const columns: Column<DeviceCommand>[] = [
    { header: "Command", cell: (c) => COMMAND_LABELS[c.type] ?? c.type },
    { header: "Status", cell: (c) => <Badge variant={STATUS_VARIANT[c.status] ?? "outline"}>{c.status}</Badge> },
    { header: "Queued", cell: (c) => formatDateTime(c.created_at) },
    { header: "Result", cell: (c) => <span className="text-xs text-muted-foreground">{c.result || "—"}</span> },
  ];

  return (
    <Dialog open={!!device} onClose={onClose} title={device ? `${device.name} commands` : ""} maxWidth="max-w-3xl">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {COMMANDS.filter((c) => !c.acOnly || device?.mode === "ac").map((c) => (
            <Button
              key={c.type}
              variant={c.destructive ? "outline" : "secondary"}
              className={c.destructive ? "min-h-11 text-destructive" : "min-h-11"}
              onClick={() => setPending(c)}
            >
              <c.icon className="mr-2 size-4" aria-hidden />
              {COMMAND_LABELS[c.type]}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Commands wait in a queue until the device next checks in, usually within a minute while it is online.
        </p>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(c) => c.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No commands sent yet"
          ariaLabel="Command log"
        />
      </div>
      <ConfirmDialog
        open={!!pending}
        title={pending ? `${COMMAND_LABELS[pending.type]}?` : ""}
        description={pending?.confirm}
        confirmLabel={pending ? COMMAND_LABELS[pending.type] : "Confirm"}
        destructive={pending?.destructive}
        loading={send.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() =>
          device && pending && send.mutate({ id: device.id, type: pending.type }, { onSettled: () => setPending(null) })
        }
      />
    </Dialog>
  );
}
