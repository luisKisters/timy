"use client";

import { cn } from "@/lib/utils";

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  tone?: "default" | "ok";
}

export function Chip({
  selected,
  tone = "default",
  className,
  type = "button",
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn("chip", tone === "ok" && "ok", selected && "is-active", className)}
      {...props}
    />
  );
}
