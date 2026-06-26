"use client";

import {
  cloneElement,
  isValidElement,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/base";
import { cn } from "@/lib/utils";

type Side = "top" | "bottom" | "left" | "right";

const sidePos: Record<Side, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
  left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
  right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
};

/**
 * Lightweight hover/focus tooltip — no portal, no extra deps.
 *
 * Wraps a single interactive child and shows `content` on hover or keyboard focus.
 * The child keeps its own behaviour; we only add `aria-describedby` + event handlers.
 * Light-theme, tenant-branding-aware via semantic tokens.
 */
export function Tooltip({
  content,
  side = "top",
  delay = 120,
  children,
  className,
}: {
  content: ReactNode;
  side?: Side;
  /** Hover open delay in ms. */
  delay?: number;
  children: ReactElement;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!isValidElement(children) || content == null || content === "") return children;

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  };

  const childProps = children.props as Record<string, unknown>;
  const trigger = cloneElement(children, {
    "aria-describedby": open ? id : undefined,
    onMouseEnter: (e: React.MouseEvent) => {
      (childProps.onMouseEnter as ((e: React.MouseEvent) => void) | undefined)?.(e);
      show();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      (childProps.onMouseLeave as ((e: React.MouseEvent) => void) | undefined)?.(e);
      hide();
    },
    onFocus: (e: React.FocusEvent) => {
      (childProps.onFocus as ((e: React.FocusEvent) => void) | undefined)?.(e);
      show();
    },
    onBlur: (e: React.FocusEvent) => {
      (childProps.onBlur as ((e: React.FocusEvent) => void) | undefined)?.(e);
      hide();
    },
  } as Record<string, unknown>);

  return (
    <span className="relative inline-flex" onMouseLeave={hide}>
      {trigger}
      {open && (
        <span
          role="tooltip"
          id={id}
          className={cn(
            "pointer-events-none absolute z-[120] whitespace-nowrap rounded-md border border-border bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md",
            "animate-tooltip-in",
            sidePos[side],
            className,
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}

type IconButtonProps = {
  /** Tooltip + accessible label (icon-only buttons need both). */
  label: ReactNode;
  children: ReactNode;
  side?: Side;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Icon-only button wrapped in a tooltip, with the label mirrored onto `aria-label`
 * for screen readers. Use for data-table row actions (Edit / Delete / Reset PIN / …).
 */
export function IconButton({ label, children, side = "top", className, ...props }: IconButtonProps) {
  const ariaLabel = typeof label === "string" ? label : undefined;
  return (
    <Tooltip content={label} side={side}>
      <Button variant="ghost" size="icon" aria-label={ariaLabel} className={className} {...props}>
        {children}
      </Button>
    </Tooltip>
  );
}
