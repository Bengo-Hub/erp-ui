"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/form";
import { cn } from "@/lib/utils";

export interface TransferItem {
  value: string;
  label: string;
  group?: string;
}

interface TransferListProps {
  items: TransferItem[];
  /** Currently-assigned values. */
  selected: string[];
  onMove: (value: string, assign: boolean) => void;
  leftTitle?: string;
  rightTitle?: string;
  disabled?: boolean;
}

/** One column of the transfer list. */
function TransferPane({
  title,
  list,
  assign,
  disabled,
  onMove,
}: {
  title: string;
  list: TransferItem[];
  assign: boolean;
  disabled?: boolean;
  onMove: (value: string, assign: boolean) => void;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border bg-accent/5 px-3 py-2">
        <span className="text-xs font-semibold text-foreground">{title}</span>
        <span className="text-[10px] font-bold text-muted-foreground">{list.length}</span>
      </div>
      <ul className="max-h-72 overflow-y-auto">
        {list.map((it) => (
          <li key={it.value}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onMove(it.value, assign)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent/10 disabled:opacity-50"
            >
              <span className="min-w-0 truncate">
                {it.label}
                {it.group && (
                  <span className="ml-1.5 text-[10px] uppercase text-muted-foreground">{it.group}</span>
                )}
              </span>
              {assign ? (
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
              )}
            </button>
          </li>
        ))}
        {!list.length && (
          <li className="px-3 py-6 text-center text-xs text-muted-foreground">Nothing here</li>
        )}
      </ul>
    </div>
  );
}

/** Two-pane assignment widget (available ↔ assigned), used for roles/perms. */
export function TransferList({
  items,
  selected,
  onMove,
  leftTitle = "Available",
  rightTitle = "Assigned",
  disabled,
}: TransferListProps) {
  const [search, setSearch] = useState("");
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const { available, assigned } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const match = (it: TransferItem) =>
      !q || it.label.toLowerCase().includes(q) || (it.group ?? "").toLowerCase().includes(q);
    return {
      available: items.filter((it) => !selectedSet.has(it.value) && match(it)),
      assigned: items.filter((it) => selectedSet.has(it.value) && match(it)),
    };
  }, [items, selectedSet, search]);

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={cn(disabled && "opacity-50")}
        disabled={disabled}
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <TransferPane title={leftTitle} list={available} assign disabled={disabled} onMove={onMove} />
        <TransferPane title={rightTitle} list={assigned} assign={false} disabled={disabled} onMove={onMove} />
      </div>
    </div>
  );
}
