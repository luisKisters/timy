"use client";

import { useEffect } from "react";

/**
 * Prevents iOS Safari rubber-band page scrolling.
 * Uses capture phase so no child can stop propagation before us.
 * Elements with data-scrollable="true" are allowed to scroll.
 */
export function ScrollLock() {
  useEffect(() => {
    function block(e: TouchEvent) {
      let el = e.target as HTMLElement | null;
      while (el) {
        if (el.dataset?.scrollable === "true") return;
        el = el.parentElement;
      }
      e.preventDefault();
    }
    document.addEventListener("touchmove", block, { passive: false, capture: true });
    return () => document.removeEventListener("touchmove", block, { capture: true } as EventListenerOptions);
  }, []);
  return null;
}
