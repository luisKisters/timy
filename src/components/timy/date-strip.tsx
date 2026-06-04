"use client";

import { cn } from "@/lib/utils";

export interface DateStripDay {
  /** Stable unique key (e.g. ISO date). */
  key: string;
  /** Short weekday label, e.g. "TUE". */
  weekday: string;
  /** Day number / short label, e.g. 17. */
  day: number | string;
  /** Optional count badge (picked / available slots). */
  count?: number;
  disabled?: boolean;
}

export interface DateStripProps {
  days: DateStripDay[];
  selected: string;
  onSelect: (key: string) => void;
  className?: string;
  "aria-label"?: string;
}

export function DateStrip({
  days,
  selected,
  onSelect,
  className,
  ...rest
}: DateStripProps) {
  return (
    <div
      className={cn("datestrip", className)}
      role="tablist"
      aria-label={rest["aria-label"] ?? "Days"}
    >
      {days.map((d) => {
        const active = d.key === selected;
        return (
          <button
            key={d.key}
            type="button"
            role="tab"
            aria-selected={active}
            aria-current={active ? "date" : undefined}
            disabled={d.disabled}
            className={cn("d", active && "is-active")}
            onClick={() => onSelect(d.key)}
          >
            <small>{d.weekday}</small>
            <b>{d.day}</b>
            {typeof d.count === "number" && d.count > 0 && (
              <span className="n">{d.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
