import { useState } from "react";
import { render } from "vitest-browser-react";
import { describe, expect, test, vi } from "vitest";
import { ScanConfig, VoteScreen, type VoteSlot } from "@/components/event/vote-screen";

const TZ = "America/New_York";
const SLOTS: VoteSlot[] = [
  { id: "s1", start: "2024-03-18T14:00:00.000Z", end: "2024-03-18T14:30:00.000Z" }, // 10:00 AM
  { id: "s2", start: "2024-03-18T14:30:00.000Z", end: "2024-03-18T15:00:00.000Z" }, // 10:30 AM
  { id: "s3", start: "2024-03-18T15:00:00.000Z", end: "2024-03-18T15:30:00.000Z" }, // 11:00 AM
];

function Harness({
  onSubmit = () => {},
  autoCheckIds = [],
  onAutoCheckSpy,
}: {
  onSubmit?: () => void;
  autoCheckIds?: string[];
  onAutoCheckSpy?: (c: ScanConfig) => void;
}) {
  const [name, setName] = useState("Ada");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  return (
    <VoteScreen
      title="Team Standup"
      hostName="Luis"
      tz={TZ}
      slots={SLOTS}
      participantNames={["Luis", "Ada", "Max"]}
      name={name}
      onNameChange={setName}
      selected={selected}
      onToggle={(id) =>
        setSelected((p) => {
          const n = new Set(p);
          if (n.has(id)) n.delete(id);
          else n.add(id);
          return n;
        })
      }
      onAutoCheck={async (config) => {
        onAutoCheckSpy?.(config);
        setSelected((p) => {
          const n = new Set(p);
          autoCheckIds.forEach((id) => n.add(id));
          return n;
        });
      }}
      onSubmit={onSubmit}
    />
  );
}

describe("VoteScreen", () => {
  test("shows the host and an avatar stack; no AI surface", async () => {
    const screen = await render(<Harness />);
    await expect.element(screen.getByText("Hosted by Luis")).toBeVisible();
    expect(document.querySelector(".avstack")).not.toBeNull();
    expect(document.querySelector(".soon")).toBeNull();
    expect(document.body.textContent ?? "").not.toMatch(/\bAI\b/);
  });

  test("toggles a slot on tap", async () => {
    const screen = await render(<Harness />);
    const slot = screen.getByRole("button", { name: /10:00\s*–\s*10:30 AM/ });
    await expect.element(slot).toHaveAttribute("aria-pressed", "false");
    await slot.click();
    await expect.element(slot).toHaveAttribute("aria-pressed", "true");
  });

  test("Auto-check opens a required config sheet (no scan until confirmed)", async () => {
    const onAutoCheckSpy = vi.fn();
    const screen = await render(<Harness onAutoCheckSpy={onAutoCheckSpy} />);
    await screen.getByRole("button", { name: /Auto-check calendar/ }).click();
    await expect
      .element(screen.getByRole("dialog", { name: "Check your calendar" }))
      .toBeVisible();
    expect(onAutoCheckSpy).not.toHaveBeenCalled(); // gated behind the sheet
  });

  test("config sheet's scan is blocked until at least one weekday is set", async () => {
    const screen = await render(<Harness />);
    await screen.getByRole("button", { name: /Auto-check calendar/ }).click();
    // deselect the default Mon–Fri
    for (const d of ["Mon", "Tue", "Wed", "Thu", "Fri"]) {
      await screen.getByRole("button", { name: d }).click();
    }
    await expect
      .element(screen.getByRole("button", { name: "Check calendar", exact: true }))
      .toBeDisabled();
  });

  test("confirming the scan ticks the free slots on the same list", async () => {
    const screen = await render(<Harness autoCheckIds={["s1", "s3"]} />);
    await screen.getByRole("button", { name: /Auto-check calendar/ }).click();
    await screen.getByRole("button", { name: "Check calendar", exact: true }).click();

    await expect
      .element(screen.getByRole("button", { name: /10:00\s*–\s*10:30 AM/ }))
      .toHaveAttribute("aria-pressed", "true");
    await expect
      .element(screen.getByRole("button", { name: /11:00\s*–\s*11:30 AM/ }))
      .toHaveAttribute("aria-pressed", "true");
    await expect.element(screen.getByText(/Ticked from your calendar/)).toBeVisible();
  });

  test("cancelling the sheet ticks nothing", async () => {
    const screen = await render(<Harness autoCheckIds={["s1", "s3"]} />);
    await screen.getByRole("button", { name: /Auto-check calendar/ }).click();
    await expect
      .element(screen.getByRole("dialog", { name: "Check your calendar" }))
      .toBeVisible();
    (document.querySelector(".sheet-scrim") as HTMLElement).click();
    await expect
      .element(screen.getByRole("dialog", { name: "Check your calendar" }))
      .not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: /10:00\s*–\s*10:30 AM/ }))
      .toHaveAttribute("aria-pressed", "false");
  });
});
