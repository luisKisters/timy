import type { Transition, Variants } from "motion/react";

/**
 * Shared Motion (motion.dev) variants for Timy.
 *
 * Every factory takes a `reduced` flag (from `useReducedMotion()` in a
 * component) and, when set, collapses to an opacity-only / instant transition
 * with NO transform — honouring `prefers-reduced-motion`. These are pure
 * functions so the reduced-motion contract is unit-testable in node.
 */

export const EASE_OUT: Transition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] };
export const SPRING: Transition = { type: "spring", stiffness: 420, damping: 32 };
export const INSTANT: Transition = { duration: 0 };

/** Content fade + lift-in (hero text, stream sections). */
export function fadeInUp(reduced?: boolean | null): Variants {
  if (reduced) {
    return {
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: INSTANT },
    };
  }
  return {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: EASE_OUT },
  };
}

/** Container that staggers its children in (recents list, slot list). */
export function staggerContainer(reduced?: boolean | null): Variants {
  return {
    hidden: {},
    show: {
      transition: reduced ? {} : { staggerChildren: 0.05, delayChildren: 0.02 },
    },
  };
}

/** Bottom-sheet scrim fade. */
export function sheetScrim(reduced?: boolean | null): Variants {
  return {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: reduced ? INSTANT : { duration: 0.18 } },
    exit: { opacity: 0, transition: reduced ? INSTANT : { duration: 0.15 } },
  };
}

/** Bottom-sheet panel slide-up. */
export function sheetPanel(reduced?: boolean | null): Variants {
  if (reduced) {
    return {
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: INSTANT },
      exit: { opacity: 0, transition: INSTANT },
    };
  }
  return {
    hidden: { y: "100%" },
    show: { y: 0, transition: { type: "spring", stiffness: 380, damping: 38 } },
    exit: { y: "100%", transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
  };
}

/** Tick / success-check pop. */
export function checkPop(reduced?: boolean | null): Variants {
  if (reduced) {
    return { hidden: { opacity: 0 }, show: { opacity: 1, transition: INSTANT } };
  }
  return {
    hidden: { scale: 0, opacity: 0 },
    show: { scale: 1, opacity: 1, transition: SPRING },
  };
}

/** Card removal exit (collapse + fade) for the Review screen. */
export function collapseOut(reduced?: boolean | null): Variants {
  if (reduced) {
    return {
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: INSTANT },
      exit: { opacity: 0, transition: INSTANT },
    };
  }
  return {
    hidden: { opacity: 0, height: 0 },
    show: { opacity: 1, height: "auto", transition: EASE_OUT },
    exit: { opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.2 } },
  };
}

/** `whileTap` press-scale for CTAs — empty (no transform) when reduced. */
export function pressScale(reduced?: boolean | null): { scale: number } | Record<string, never> {
  return reduced ? {} : { scale: 0.97 };
}
