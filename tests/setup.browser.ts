// Browser-mode test setup.
//
// The ported design-system stylesheet is imported so computed-style fidelity
// assertions resolve against real CSS.
import { afterEach } from "vitest";
import { cleanup } from "vitest-browser-react";
import "@/styles/timy.css";

// Explicit unmount between tests — guarantees fixed-position overlays
// (bottom-sheet scrims) never leak into the next test's viewport.
afterEach(() => {
  cleanup();
});
