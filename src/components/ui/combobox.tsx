"use client";

import { Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  loading?: boolean;
  /** Allow clearing the selection (renders an x button). */
  clearable?: boolean;
  /** Optional async search — called as the user types (debounce upstream if needed). */
  onSearch?: (query: string) => void;
  id?: string;
  className?: string;
}

/**
 * Searchable single-select. Type-to-filter, full keyboard nav (↑/↓/Enter/Esc),
 * accessible (listbox + active-descendant). Light-theme, tenant-branding-aware
 * via semantic tokens. Controlled by `value` (the option's value).
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No matches",
  disabled,
  loading,
  clearable = true,
  onSearch,
  id,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  // When onSearch is provided, the parent owns filtering; otherwise filter locally.
  const filtered = useMemo(() => {
    if (onSearch) return options;
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, onSearch]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Focus the search box + reset active index when opening.
  useEffect(() => {
    if (open) {
      setActiveIndex(0);
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
    setQuery("");
  }, [open]);

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const pick = useCallback(
    (opt: ComboboxOption) => {
      onChange(opt.value);
      setOpen(false);
    },
    [onChange],
  );

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt) pick(opt);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const listId = `${id ?? "combobox"}-list`;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-left text-sm shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {clearable && selected && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear selection"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
            </span>
          )}
          <ChevronsUpDown className="size-4 text-muted-foreground" aria-hidden />
        </span>
      </button>

      {open && (
        <div className="absolute z-[110] mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-2.5 py-2">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
                onSearch?.(e.target.value);
              }}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              role="combobox"
              aria-controls={listId}
              aria-expanded={open}
              aria-autocomplete="list"
            />
            {loading && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />}
          </div>
          <ul ref={listRef} id={listId} role="listbox" className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                {loading ? "Loading…" : emptyText}
              </li>
            ) : (
              filtered.map((opt, i) => {
                const isSelected = opt.value === value;
                const isActive = i === activeIndex;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => pick(opt)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm",
                      isActive ? "bg-accent text-accent-foreground" : "text-foreground",
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
