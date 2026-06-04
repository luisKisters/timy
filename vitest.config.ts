import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const alias = { "@": path.resolve(root, "src") };

export default defineConfig({
  test: {
    projects: [
      // Pure logic — plain Node environment, fast.
      {
        resolve: { alias },
        test: {
          name: "unit",
          environment: "node",
          include: [
            "src/**/*.unit.test.{ts,tsx}",
            "tests/unit/**/*.{test,spec}.{ts,tsx}",
          ],
        },
      },
      // Component / "unit-in-browser" tests — the acceptance gate.
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "browser",
          include: [
            "src/**/*.browser.test.{ts,tsx}",
            "tests/browser/**/*.{test,spec}.{ts,tsx}",
          ],
          setupFiles: ["./tests/setup.browser.ts"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
