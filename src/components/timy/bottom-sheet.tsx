"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { sheetPanel, sheetScrim } from "@/lib/motion";

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}

export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  className,
  ...rest
}: BottomSheetProps) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="scrim"
          className="sheet-scrim"
          variants={sheetScrim(reduced)}
          initial="hidden"
          animate="show"
          exit="exit"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      {open && (
        <motion.div
          key="panel"
          className={cn("sheet", className)}
          variants={sheetPanel(reduced)}
          initial="hidden"
          animate="show"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-label={rest["aria-label"] ?? title}
        >
          <div className="grip" aria-hidden="true" />
          {title && <h4>{title}</h4>}
          {subtitle && <p className="sub">{subtitle}</p>}
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
