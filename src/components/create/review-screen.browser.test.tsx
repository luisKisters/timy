import { useState } from "react";
import { render } from "vitest-browser-react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ReviewScreen } from "@/components/create/review-screen";
import { ReviewConnected } from "@/components/create/review-connected";
import { CreateDraftProvider } from "@/components/create/create-draft-context";
import {
  type CreateDraft,
  type DraftSlot,
  generateDraftId,
  getActiveDraftId,
  loadDraft,
  saveDraft,
  setActiveDraftId,
} from "@/lib/create-draft";
import type { ExpiryOption } from "@/lib/domain/expiry";

const TZ = "America/New_York";
// Mon Mar 18 ×2, Tue Mar 19 ×1 (EDT)
const SLOTS: DraftSlot[] = [
  { start: "2024-03-18T18:00:00.000Z", end: "2024-03-18T18:30:00.000Z" }, // 2:00 PM
  { start: "2024-03-18T18:30:00.000Z", end: "2024-03-18T19:00:00.000Z" }, // 2:30 PM
  { start: "2024-03-19T15:00:00.000Z", end: "2024-03-19T15:30:00.000Z" }, // 11:00 AM
];

function Harness({
  onBack = () => {},
  onConfirm = () => {},
  confirming = false,
  initial,
}: {
  onBack?: () => void;
  onConfirm?: () => void;
  confirming?: boolean;
  initial: DraftSlot[];
}) {
  const [slots, setSlots] = useState<DraftSlot[]>(initial);
  return (
    <ReviewScreen
      title="Team Standup"
      tz={TZ}
      slots={slots}
      onRemoveSlot={(start) => setSlots((p) => p.filter((s) => s.start !== start))}
      onBack={onBack}
      onConfirm={onConfirm}
      confirming={confirming}
    />
  );
}

function seedDraft(slots: DraftSlot[]) {
  sessionStorage.clear();
  const d: CreateDraft = {
    id: generateDraftId(),
    title: "Team Standup",
    hostName: "Luis",
    expiry: "3 days",
    slotLengthMin: 30,
    tz: TZ,
    slots,
    createdAt: Date.now(),
  };
  saveDraft(sessionStorage, d);
  setActiveDraftId(sessionStorage, d.id);
}

describe("ReviewScreen", () => {
  test("shows one day at a time via the date strip", async () => {
    const screen = await render(<Harness initial={SLOTS} />);
    // first day (Mon 18) → 2 cards
    expect(document.querySelectorAll(".slot").length).toBe(2);
    await expect.element(screen.getByText(/2:00\s*–\s*2:30 PM/)).toBeVisible();

    await screen.getByRole("tab", { name: /19/ }).click();
    // (cards collapse/cross-fade on day switch — assert once settled)
    await expect.element(screen.getByText(/11:00\s*–\s*11:30 AM/)).toBeVisible();
    await expect
      .element(screen.getByText(/2:00\s*–\s*2:30 PM/))
      .not.toBeInTheDocument();
  });

  test("trash removes a slot (collapses out)", async () => {
    const screen = await render(<Harness initial={SLOTS} />);
    expect(document.querySelectorAll(".slot").length).toBe(2);
    await screen.getByRole("button", { name: /Remove 2:00/ }).click();
    await expect
      .element(screen.getByText(/2:00\s*–\s*2:30 PM/))
      .not.toBeInTheDocument();
    await expect.element(screen.getByText(/2:30\s*–\s*3:00 PM/)).toBeVisible();
  });

  test("Back and Confirm invoke their callbacks", async () => {
    const onBack = vi.fn();
    const onConfirm = vi.fn();
    const screen = await render(
      <Harness initial={SLOTS} onBack={onBack} onConfirm={onConfirm} />,
    );
    await screen.getByRole("button", { name: "Confirm" }).click();
    expect(onConfirm).toHaveBeenCalledOnce();
    await screen.getByRole("button", { name: "← Back" }).click();
    expect(onBack).toHaveBeenCalledOnce();
  });

  test("Confirm is disabled with no slots", async () => {
    const screen = await render(<Harness initial={[]} />);
    await expect.element(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });
});

describe("ReviewConnected", () => {
  beforeEach(() => sessionStorage.clear());

  test("Confirm persists the draft, navigates to the event, and resets", async () => {
    seedDraft(SLOTS);
    const createEvent = vi.fn(
      async (_input: {
        title: string;
        hostName: string;
        expiry: ExpiryOption;
        slots: DraftSlot[];
      }) => ({ eventId: "evt_123" }),
    );
    const onNavigate = vi.fn();

    const screen = await render(
      <CreateDraftProvider>
        <ReviewConnected createEvent={createEvent} onNavigate={onNavigate} onBack={() => {}} />
      </CreateDraftProvider>,
    );

    const confirm = screen.getByRole("button", { name: "Confirm" });
    await expect.element(confirm).toBeEnabled(); // draft hydrated
    await confirm.click();

    await vi.waitFor(() => expect(onNavigate).toHaveBeenCalledWith("evt_123"));
    const input = createEvent.mock.calls[0][0];
    expect(input.title).toBe("Team Standup");
    expect(input.hostName).toBe("Luis");
    expect(input.expiry).toBe("3 days");
    expect(input.slots).toHaveLength(3);

    // draft reset → a fresh, empty active draft
    const activeId = getActiveDraftId(sessionStorage);
    expect(activeId).toBeTruthy();
    expect(loadDraft(sessionStorage, activeId as string)?.title).toBe("");
  });
});
