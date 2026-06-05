import { render } from "vitest-browser-react";
import { describe, expect, test, vi } from "vitest";
import { ResultsScreen, type ScoredSlot } from "@/components/event/results-screen";

const TZ = "America/New_York";
const SCORES: ScoredSlot[] = [
  { slotId: "s1", start: "2024-03-18T14:00:00.000Z", end: "2024-03-18T14:30:00.000Z", available: 5, total: 5, percentage: 100 },
  { slotId: "s2", start: "2024-03-19T15:00:00.000Z", end: "2024-03-19T15:30:00.000Z", available: 3, total: 5, percentage: 60 },
  { slotId: "s3", start: "2024-03-20T16:00:00.000Z", end: "2024-03-20T16:30:00.000Z", available: 2, total: 5, percentage: 40 },
];
const PARTICIPANTS = ["L", "A", "M", "J", "S"].map((n, i) => ({ id: `p${i}`, name: n }));
const AVAIL: Record<string, string[]> = {
  s1: PARTICIPANTS.map((p) => p.id),
  s2: ["p0", "p1", "p2"],
  s3: ["p0", "p1"],
};
const isAvailable = (pid: string, sid: string) => (AVAIL[sid] ?? []).includes(pid);

// Realistic single-voter scores (one person → per-slot total is 1).
const ONE_VOTER_SCORES: ScoredSlot[] = [
  { slotId: "s1", start: "2024-03-18T14:00:00.000Z", end: "2024-03-18T14:30:00.000Z", available: 1, total: 1, percentage: 100 },
  { slotId: "s2", start: "2024-03-19T15:00:00.000Z", end: "2024-03-19T15:30:00.000Z", available: 0, total: 1, percentage: 0 },
];

function Harness({
  resolvedSlotId = null,
  onConfirm = () => {},
  onChangeTime = () => {},
  onAddToCalendar = () => {},
}: {
  resolvedSlotId?: string | null;
  onConfirm?: (id: string) => void;
  onChangeTime?: () => void;
  onAddToCalendar?: (id: string) => void;
}) {
  return (
    <ResultsScreen
      title="Team Standup"
      tz={TZ}
      scores={SCORES}
      participants={PARTICIPANTS}
      isAvailable={isAvailable}
      resolvedSlotId={resolvedSlotId}
      onConfirm={onConfirm}
      onChangeTime={onChangeTime}
      onAddToCalendar={onAddToCalendar}
    />
  );
}

describe("ResultsScreen", () => {
  test("best slot surfaces as the hero; no AI surface", async () => {
    const screen = await render(<Harness />);
    await expect.element(screen.getByText("Best time")).toBeVisible();
    await expect.element(screen.getByText(/Monday, Mar 18 · 10:00\s*–\s*10:30 AM/)).toBeVisible();
    await expect.element(screen.getByText(/Everyone is available!/)).toBeVisible();
    expect(document.querySelector(".soon")).toBeNull();
    expect(document.body.textContent ?? "").not.toMatch(/\bAI\b/);
  });

  test("Confirm invokes onConfirm with the best slot", async () => {
    const onConfirm = vi.fn();
    const screen = await render(<Harness onConfirm={onConfirm} />);
    await screen.getByRole("button", { name: /^Confirm / }).click();
    expect(onConfirm).toHaveBeenCalledWith("s1");
  });

  test("matrix view renders a participants × slots grid with totals", async () => {
    const screen = await render(<Harness />);
    await screen.getByRole("button", { name: "See options matrix" }).click();
    await expect.element(screen.getByRole("grid")).toBeVisible();
    expect(document.querySelector('[data-available="1"]')).not.toBeNull();
    // best column total
    await expect.element(screen.getByText("5/5")).toBeVisible();
  });

  test("confirmed state shows the share modal message", async () => {
    const screen = await render(<Harness resolvedSlotId="s1" />);
    await expect.element(screen.getByText("Confirmed")).toBeVisible();
    await screen.getByRole("button", { name: /Share the time/ }).click();
    await expect
      .element(screen.getByText(/confirmed for Monday, Mar 18 at 10:00 AM/))
      .toBeVisible();
  });

  test("re-confirmed (non-best) shows 'Time changed' + Share update", async () => {
    const screen = await render(<Harness resolvedSlotId="s2" />);
    await expect.element(screen.getByText("Time changed")).toBeVisible();
    await screen.getByRole("button", { name: /Share update/ }).click();
    await expect
      .element(screen.getByText(/has moved to Tuesday, Mar 19 at 11:00 AM/))
      .toBeVisible();
  });

  test("Add to calendar invokes the callback when confirmed (best)", async () => {
    const onAddToCalendar = vi.fn();
    const screen = await render(<Harness resolvedSlotId="s1" onAddToCalendar={onAddToCalendar} />);
    await screen.getByRole("button", { name: "Add to calendar" }).click();
    expect(onAddToCalendar).toHaveBeenCalledWith("s1");
  });

  test("tapping an 'other option' card picks that slot", async () => {
    const onConfirm = vi.fn();
    const screen = await render(<Harness onConfirm={onConfirm} />);
    // s2 is rendered as a tappable card (button) under "Other options".
    await screen.getByRole("button", { name: /Tuesday, Mar 19/ }).click();
    expect(onConfirm).toHaveBeenCalledWith("s2");
  });

  test("changed confirmation keeps a 'Best time' badge on the best card", async () => {
    const screen = await render(<Harness resolvedSlotId="s2" />);
    await expect.element(screen.getByText("Best time")).toBeVisible();
  });

  test("with only one voter: no-favorite placeholder + Share, no 'everyone available'", async () => {
    const onShareInvite = vi.fn();
    const screen = await render(
      <ResultsScreen
        title="Team Standup"
        tz={TZ}
        scores={ONE_VOTER_SCORES}
        participants={[{ id: "p0", name: "L" }]}
        isAvailable={() => true}
        resolvedSlotId={null}
        onConfirm={() => {}}
        onChangeTime={() => {}}
        onAddToCalendar={() => {}}
        onShareInvite={onShareInvite}
      />,
    );
    await expect.element(screen.getByText("No favorite yet")).toBeVisible();
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/Everyone is available/);
    expect(text).not.toMatch(/Best time/);
    await screen.getByRole("button", { name: /Share/ }).click();
    expect(onShareInvite).toHaveBeenCalled();
  });

  test("with one voter you can still pick a time by tapping a card", async () => {
    const onConfirm = vi.fn();
    const screen = await render(
      <ResultsScreen
        title="Team Standup"
        tz={TZ}
        scores={ONE_VOTER_SCORES}
        participants={[{ id: "p0", name: "L" }]}
        isAvailable={() => true}
        resolvedSlotId={null}
        onConfirm={onConfirm}
        onChangeTime={() => {}}
        onAddToCalendar={() => {}}
      />,
    );
    await screen.getByRole("button", { name: /Monday, Mar 18/ }).click();
    expect(onConfirm).toHaveBeenCalledWith("s1");
  });
});
