import { cn } from "@/lib/utils";

export interface StepperProps {
  total: number;
  /** 1-based count of filled bars. */
  current: number;
  /** e.g. "1/3" or "Done ✓". */
  label?: string;
  className?: string;
}

export function Stepper({ total, current, label, className }: StepperProps) {
  return (
    <div
      className={cn("stepper", className)}
      role="group"
      aria-label={label ?? `Step ${current} of ${total}`}
    >
      <div className="bars" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <i key={i} className={i < current ? "on" : undefined} />
        ))}
      </div>
      {label && <span className="lbl">{label}</span>}
    </div>
  );
}
