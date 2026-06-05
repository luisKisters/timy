"use client";

import { cn } from "@/lib/utils";

export interface SlotCardProps {
  /** Primary label, e.g. "2:00 – 2:30 PM". */
  label: string;
  /** Optional sub-line, e.g. "3 of 5 available". */
  meta?: string;
  selected?: boolean;
  best?: boolean;
  /**
   * Full-green card (emerald background) when selected — used for from-calendar
   * results. Manual picks stay a white card with just an emerald tick.
   */
  green?: boolean;
  /** When provided, the whole card is a toggle button. */
  onToggle?: () => void;
  /** Right-aligned content for non-toggle cards (count, remove button). */
  trailing?: React.ReactNode;
  className?: string;
}

export function SlotCard({
  label,
  meta,
  selected,
  best,
  green,
  onToggle,
  trailing,
  className,
}: SlotCardProps) {
  const classes = cn(
    "slot",
    selected && green && "is-on",
    best && "is-best",
    !onToggle && "is-plain",
    className,
  );

  const body = (
    <>
      <span className="when">
        <b>{label}</b>
        {meta && <span>{meta}</span>}
      </span>
      {onToggle ? (
        <span className={cn("tick", selected && "is-checked")} aria-hidden="true">
          {selected ? "✓" : ""}
        </span>
      ) : (
        trailing
      )}
    </>
  );

  if (onToggle) {
    return (
      <button
        type="button"
        className={classes}
        aria-pressed={selected}
        onClick={onToggle}
      >
        {body}
      </button>
    );
  }

  return <div className={classes}>{body}</div>;
}
