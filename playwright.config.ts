import { defineConfig, devices } from "@playwright/test";

// E2E + per-phase server/action smoke tests. The webServer (next start) and a
// controlled PocketBase are wired in Phase 11 when the happy-path E2E lands.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
