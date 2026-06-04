import { useState } from "react";
import { render } from "vitest-browser-react";
import { describe, expect, test, vi } from "vitest";
import { TimesScreen } from "@/components/create/times-screen";
import type { DraftSlot } from "@/lib/create-draft";
import type { CalendarConfig } from "@/lib/calendar-config";

const TZ = "America/New_York";
const NOW = new Date("2024-03-04T12:00:00Z"); // a Monday

function Harness({
  onDone = () => {},
  addSpy,
  requestCalendarSuggestions,
  initial = [],
}: {
  onDone?: () => void;
  addSpy?: (s: DraftSlot[]) => void;
  requestCalendarSuggestions?: (c: CalendarConfig) => Promise<DraftSlot[]>;
  initial?: DraftSlot[];
}) {
  const [slots, setSlots] = useState<DraftSlot[]>(initial);
  return (
    <TimesScreen
      slots={slots}
      tz={TZ}
      slotLengthMin={30}
      now={NOW}
      onAddSlots={(s) => {
        addSpy?.(s);
        setSlots((prev) => {
          const seen = new Set(prev.map((x) => x.start));
          return [...prev, ...s.filter((x) => !seen.has(x.start))].sort((a, b) =>
            a.start.localeCompare(b.start),
          );
        });
      }}
      onRemoveSlot={(start) => setSlots((prev) => prev.filter((x) => x.start !== start))}
      onDone={onDone}
      onBack={() => {}}
      requestCalendarSuggestions={requestCalendarSuggestions ?? (async () => [])}
    />
  );
}

const localHour = (iso: string) =>
  Number(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "2-digit", hour12: false }).format(
      new Date(iso),
    ),
  );

describe("TimesScreen", () => {
  test("adds a single time", async () => {
    const screen = await render(<Harness />);
    await screen.getByRole("button", { name: "+ Add times" }).click();
    await screen.getByRole("button", { name: /Add a single time/ }).click();
    await screen.getByLabelText("Day").fill("2024-03-18");
    await screen.getByLabelText("Start time").fill("14:00");
    await screen.getByRole("button", { name: "Add time", exact: true }).click();
    await expect.element(screen.getByText(/2:00\s*–\s*2:30 PM/)).toBeVisible();
  });

  test("adds a range respecting the window + interval", async () => {
    const addSpy = vi.fn();
    const screen = await render(<Harness addSpy={addSpy} />);
    await screen.getByRole("button", { name: "+ Add times" }).click();
    await screen.getByRole("button", { name: /Add multiple times/ }).click();

    const addBtn = screen.getByRole("button", { name: /^Add \d+ slots?$/ });
    await expect.element(addBtn).toBeVisible();
    await addBtn.click();

    expect(addSpy).toHaveBeenCalledOnce();
    const added = addSpy.mock.calls[0][0] as DraftSlot[];
    expect(added.length).toBeGreaterThan(0);
    for (const s of added) {
      expect(new Date(s.end).getTime() - new Date(s.start).getTime()).toBe(30 * 60_000);
      const h = localHour(s.start);
      expect(h).toBeGreaterThanOrEqual(14);
      expect(h).toBeLessThan(16);
    }
  });

  test("calendar config → all-green suggestions → add to draft", async () => {
    const addSpy = vi.fn();
    const free: DraftSlot[] = [
      { start: "2024-03-18T14:00:00.000Z", end: "2024-03-18T14:30:00.000Z" },
      { start: "2024-03-18T15:00:00.000Z", end: "2024-03-18T15:30:00.000Z" },
    ];
    const reqSpy = vi.fn(async (_config: CalendarConfig) => free);
    const screen = await render(
      <Harness addSpy={addSpy} requestCalendarSuggestions={reqSpy} />,
    );

    await screen.getByRole("button", { name: "+ Add times" }).click();
    await screen.getByRole("button", { name: /Check my calendar/ }).click();
    await screen.getByRole("button", { name: "Find free times" }).click();

    expect(reqSpy).toHaveBeenCalledOnce();
    const config = reqSpy.mock.calls[0][0];
    expect(config.intervalMin).toBe(30);
    expect(config.tz).toBe(TZ);
    expect(config.windowStart).toBe("09:00");
    expect(config.windowEnd).toBe("17:00");

    await expect
      .element(screen.getByRole("button", { name: /Add 2 entries/ }))
      .toBeVisible();
    // suggestions are all-green (full emerald cards)
    expect(document.querySelectorAll(".slot.is-on").length).toBe(2);

    await screen.getByRole("button", { name: /Add 2 entries/ }).click();
    expect(addSpy).toHaveBeenCalledWith(free);
  });

  test("Done is disabled with no slots", async () => {
    const screen = await render(<Harness initial={[]} />);
    await expect.element(screen.getByRole("button", { name: /Done/ })).toBeDisabled();
  });

  test("Done routes onward once there are slots", async () => {
    const onDone = vi.fn();
    const slot: DraftSlot = {
      start: "2024-03-18T14:00:00.000Z",
      end: "2024-03-18T14:30:00.000Z",
    };
    const screen = await render(<Harness onDone={onDone} initial={[slot]} />);
    const done = screen.getByRole("button", { name: /Done/ });
    await expect.element(done).toBeEnabled();
    await done.click();
    expect(onDone).toHaveBeenCalledOnce();
  });

  test("no AI surface beyond the disabled 'Soon' row", async () => {
    const screen = await render(<Harness />);
    await screen.getByRole("button", { name: "+ Add times" }).click();

    const soon = document.querySelector(".soon");
    expect(soon?.textContent).toBe("Soon");
    expect(document.querySelectorAll(".soon").length).toBe(1);
    const aiRow = soon?.closest(".sheet-opt");
    expect(aiRow?.classList.contains("is-disabled")).toBe(true);
    expect(aiRow?.textContent).toContain("Ask AI");
  });
});
