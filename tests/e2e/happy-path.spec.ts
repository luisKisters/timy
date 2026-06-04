import { expect, test } from "@playwright/test";

// Full happy path: create a poll → land on Share → fill out availability (vote)
// → submit → see results → confirm the best time. Exercises server actions +
// RSC reads against a controlled PocketBase.
test("create → share → vote → results", async ({ page }) => {
  // --- Create · Setup ---
  await page.goto("/create");
  await page.getByLabel("Meeting name").fill("E2E Standup");
  await page.getByLabel("Your name").fill("Luis");
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page).toHaveURL(/\/create\/times/);

  // --- Create · Times (add one slot) ---
  await page.getByRole("button", { name: "+ Add times" }).click();
  await page.getByRole("button", { name: /Add a single time/ }).click();
  await page.getByLabel("Day").fill("2026-06-16");
  await page.getByLabel("Start time").fill("14:00");
  await page.getByRole("button", { name: "Add time", exact: true }).click();
  await expect(page.getByText(/2:00\s*–\s*2:30 PM/)).toBeVisible();
  await page.getByRole("button", { name: /Done/ }).click();

  // --- Create · Review → Confirm (persist) ---
  await expect(page).toHaveURL(/\/create\/review/);
  await page.getByRole("button", { name: "Confirm" }).click();

  // --- Share ---
  await expect(page).toHaveURL(/\/event\/.+\/share/);
  await expect(page.getByText("Your poll is ready")).toBeVisible();
  await page.getByRole("button", { name: /Fill out/ }).click();

  // --- Vote ---
  await expect(page).toHaveURL(/\/event\/[^/]+$/);
  await page.getByLabel("Your name").fill("Luis");
  await page.getByRole("button", { name: /2:00\s*–\s*2:30 PM/ }).click();
  await page.getByRole("button", { name: "Submit availability" }).click();

  // --- Results → Confirm ---
  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByText("Best time")).toBeVisible();
  await page.getByRole("button", { name: /^Confirm / }).click();
  await expect(page.getByText("Confirmed")).toBeVisible();
});
