import { render } from "vitest-browser-react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { VoteConnected } from "@/components/event/vote-connected";
import type { VoteSlot } from "@/components/event/vote-screen";

const SLOTS: VoteSlot[] = [
  { id: "s1", start: "2024-03-18T14:00:00.000Z", end: "2024-03-18T14:30:00.000Z" }, // 10:00 AM
  { id: "s2", start: "2024-03-18T14:30:00.000Z", end: "2024-03-18T15:00:00.000Z" },
  { id: "s3", start: "2024-03-18T15:00:00.000Z", end: "2024-03-18T15:30:00.000Z" },
];

beforeEach(() => {
  localStorage.clear();
});

describe("VoteConnected", () => {
  test("submits availability, saves identity, and routes to results", async () => {
    const submitVotes = vi.fn(
      async (_input: {
        eventId: string;
        name: string;
        availableSlotIds: string[];
        allSlotIds: string[];
      }) => ({ participantId: "p_1" }),
    );

    const onSubmitted = vi.fn();
    const screen = await render(
      <VoteConnected
        eventId="evt1"
        title="Standup"
        hostName="Luis"
        tz="America/New_York"
        slots={SLOTS}
        participantNames={[]}
        submitVotes={submitVotes}
        onSubmitted={onSubmitted}
      />,
    );

    await screen.getByRole("textbox", { name: "Your name" }).fill("Ada");
    await screen.getByRole("button", { name: /10:00\s*–\s*10:30 AM/ }).click(); // s1

    await screen.getByRole("button", { name: "Submit availability" }).click();

    await vi.waitFor(() => expect(submitVotes).toHaveBeenCalledOnce());
    const input = submitVotes.mock.calls[0][0];
    expect(input.eventId).toBe("evt1");
    expect(input.name).toBe("Ada");
    expect(input.availableSlotIds).toEqual(["s1"]);
    expect(input.allSlotIds).toEqual(["s1", "s2", "s3"]);

    await vi.waitFor(() => expect(onSubmitted).toHaveBeenCalledWith("evt1"));

    const identity = JSON.parse(localStorage.getItem("timy-identity") as string);
    expect(identity.evt1.name).toBe("Ada");
    expect(identity.evt1.selectedSlotIds).toEqual(["s1"]);
  });

  test("pre-ticks calendar-auto-checked slots from the URL", async () => {
    const submitVotes = vi.fn(async () => ({ participantId: "p_2" }));
    const screen = await render(
      <VoteConnected
        eventId="evt2"
        title="Standup"
        tz="America/New_York"
        slots={SLOTS}
        participantNames={[]}
        autoTickedIds={["s2"]}
        submitVotes={submitVotes}
        onSubmitted={() => {}}
      />,
    );
    await expect
      .element(screen.getByRole("button", { name: /10:30\s*–\s*11:00 AM/ }))
      .toHaveAttribute("aria-pressed", "true");
  });
});
