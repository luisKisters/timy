import { render } from "vitest-browser-react";
import { describe, expect, test, vi } from "vitest";
import { ResultsConnected } from "@/components/event/results-connected";

const TZ = "America/New_York";
const slots = [
  { id: "s1", start: "2024-03-18T14:00:00.000Z", end: "2024-03-18T14:30:00.000Z" }, // 10:00 AM
  { id: "s2", start: "2024-03-18T15:00:00.000Z", end: "2024-03-18T15:30:00.000Z" }, // 11:00 AM
];
const participants = [
  { id: "p1", name: "Ada" },
  { id: "p2", name: "Max" },
];
// s1 available to both → best; s2 only p1
const votes = [
  { participantId: "p1", slotId: "s1", available: true },
  { participantId: "p2", slotId: "s1", available: true },
  { participantId: "p1", slotId: "s2", available: true },
  { participantId: "p2", slotId: "s2", available: false },
];

describe("ResultsConnected", () => {
  test("Confirm sets the resolved slot and reveals the confirmed state", async () => {
    const confirmSlot = vi.fn(async () => {});
    const screen = await render(
      <ResultsConnected
        eventId="e1"
        title="Standup"
        tz={TZ}
        slots={slots}
        participants={participants}
        votes={votes}
        initialResolvedSlotId={null}
        confirmSlot={confirmSlot}
      />,
    );

    // best (s1) surfaces
    await expect.element(screen.getByText("Best time")).toBeVisible();

    await screen.getByRole("button", { name: /^Confirm / }).click();
    await vi.waitFor(() => expect(confirmSlot).toHaveBeenCalledWith("e1", "s1"));
    await expect.element(screen.getByText("Confirmed")).toBeVisible();
  });

  test("Change time clears the resolved slot", async () => {
    const confirmSlot = vi.fn(async () => {});
    const screen = await render(
      <ResultsConnected
        eventId="e1"
        title="Standup"
        tz={TZ}
        slots={slots}
        participants={participants}
        votes={votes}
        initialResolvedSlotId="s1"
        confirmSlot={confirmSlot}
      />,
    );
    await expect.element(screen.getByText("Confirmed")).toBeVisible();
    await screen.getByRole("button", { name: "Change time" }).click();
    await vi.waitFor(() => expect(confirmSlot).toHaveBeenCalledWith("e1", null));
    await expect.element(screen.getByText("Best time")).toBeVisible();
  });
});
