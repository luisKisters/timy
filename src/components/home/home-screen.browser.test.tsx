import { render } from "vitest-browser-react";
import { describe, expect, test, vi } from "vitest";
import { HomeScreen } from "@/components/home/home-screen";
import type { RecentEvent } from "@/lib/recent-events";

describe("HomeScreen", () => {
  test("empty state: wordmark + tagline + Create, no recents, no AI surface", async () => {
    const screen = await render(
      <HomeScreen recents={[]} onCreate={() => {}} onOpenRecent={() => {}} />,
    );
    await expect.element(screen.getByText("Timy")).toBeVisible();
    await expect
      .element(screen.getByText("Find the perfect time to meet"))
      .toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Create meeting" }))
      .toBeVisible();

    expect(document.querySelector('[aria-label="Recent meetings"]')).toBeNull();
    // no AI surface anywhere on the screen
    expect(document.querySelector(".aibar")).toBeNull();
    expect(document.body.textContent ?? "").not.toMatch(/\bAI\b/);
  });

  test("Create routes to setup (invokes onCreate)", async () => {
    const onCreate = vi.fn();
    const screen = await render(
      <HomeScreen recents={[]} onCreate={onCreate} onOpenRecent={() => {}} />,
    );
    await screen.getByRole("button", { name: "Create meeting" }).click();
    expect(onCreate).toHaveBeenCalledOnce();
  });

  test("renders recents (avatars + status) and opens one on tap", async () => {
    const onOpenRecent = vi.fn();
    const recents: RecentEvent[] = [
      {
        id: "e1",
        title: "Team Standup",
        visitedAt: 2,
        participants: ["Luis", "Ada", "Max", "Jo", "Sam"],
        participantCount: 5,
      },
      { id: "e2", title: "Weekend Trip", visitedAt: 1, state: "voting" },
    ];
    const screen = await render(
      <HomeScreen recents={recents} onCreate={() => {}} onOpenRecent={onOpenRecent} />,
    );

    await expect.element(screen.getByText("Team Standup")).toBeVisible();
    await expect.element(screen.getByText("5 voted")).toBeVisible();
    await expect.element(screen.getByText("Weekend Trip")).toBeVisible();

    const stack = document.querySelector('[aria-label="Recent meetings"] .avstack');
    expect(stack).not.toBeNull();
    // 5 people, max 4 → "+1" overflow chip
    expect(document.querySelector(".avstack .more")?.textContent).toBe("+1");

    await screen.getByText("Team Standup").click();
    expect(onOpenRecent).toHaveBeenCalledWith("e1");
  });
});
