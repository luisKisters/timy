import { defineConfig, devices } from "@playwright/test";
import { E2E_PB } from "./tests/e2e/global-setup";

// Self-contained happy-path E2E: globalSetup boots a throwaway PocketBase on a
// dedicated port and the dev webServer authenticates against it with superuser
// credentials — `pnpm test:e2e` needs no manual setup.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  timeout: 60_000,
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      POCKETBASE_URL: E2E_PB.url,
      POCKETBASE_ADMIN_EMAIL: E2E_PB.email,
      POCKETBASE_ADMIN_PASSWORD: E2E_PB.password,
      NEXT_PUBLIC_POCKETBASE_URL: E2E_PB.url,
    },
  },
});
