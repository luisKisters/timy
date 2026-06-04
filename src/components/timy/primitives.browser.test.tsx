import { useState } from "react";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { afterEach, describe, expect, test } from "vitest";
import {
  AppShell,
  AvatarStack,
  BottomSheet,
  Button,
  Chip,
  DateStrip,
  SlotCard,
  Stepper,
} from "@/components/timy";

function bg(el: Element | null): string {
  return el ? getComputedStyle(el).backgroundColor : "";
}

describe("Button", () => {
  test("renders an accessible button with the variant class", async () => {
    const screen = await render(
      <Button variant="primary" size="lg" block>
        Continue
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "Continue" });
    await expect.element(btn).toBeVisible();
    expect(btn.element().className).toContain("btn-primary");
    expect(btn.element().className).toContain("btn-lg");
    expect(btn.element().className).toContain("btn-block");
  });
});

describe("AppShell dock (fidelity)", () => {
  test("stacks the secondary button directly above the primary", async () => {
    await render(
      <AppShell
        dock={
          <>
            <Button variant="secondary" block>
              Done
            </Button>
            <Button variant="primary" size="lg" block>
              Add times
            </Button>
          </>
        }
      >
        <p>stream</p>
      </AppShell>,
    );
    const secondary = document.querySelector(".btn-secondary") as HTMLElement;
    const primary = document.querySelector(".btn-primary") as HTMLElement;
    const s = secondary.getBoundingClientRect();
    const p = primary.getBoundingClientRect();
    // secondary sits entirely above primary
    expect(s.bottom).toBeLessThanOrEqual(p.top + 1);
  });

  test("dock narrows from full width on phone to a centered column on desktop", async () => {
    await render(
      <AppShell
        dock={
          <Button variant="primary" size="lg" block>
            Create meeting
          </Button>
        }
      >
        <p>stream</p>
      </AppShell>,
    );
    const ratio = () => {
      const dock = document.querySelector(".dock") as HTMLElement;
      const stack = document.querySelector(".dock-stack") as HTMLElement;
      return (
        stack.getBoundingClientRect().width / dock.getBoundingClientRect().width
      );
    };

    await page.viewport(380, 800);
    const phone = ratio();
    await page.viewport(1280, 900);
    const desktop = ratio();

    // phone ≈ full width (minus the dock's side padding); desktop ≈ 60%
    expect(phone).toBeGreaterThan(0.85);
    expect(desktop).toBeLessThan(0.7);
    expect(desktop).toBeLessThan(phone - 0.15);

    await page.viewport(390, 844); // reset for other tests
  });
});

describe("SlotCard", () => {
  test("manual pick: white card + emerald tick on tap", async () => {
    function Wrap() {
      const [on, setOn] = useState(false);
      return (
        <SlotCard label="2:00 – 2:30 PM" selected={on} onToggle={() => setOn((v) => !v)} />
      );
    }
    const screen = await render(<Wrap />);
    const slot = () => document.querySelector(".slot");
    const tick = () => document.querySelector(".slot .tick");

    expect(bg(slot())).toBe("rgb(255, 255, 255)");
    expect(slot()?.classList.contains("is-on")).toBe(false);

    await screen.getByRole("button", { name: /2:00/ }).click();

    await expect
      .element(screen.getByRole("button", { name: /2:00/ }))
      .toHaveAttribute("aria-pressed", "true");
    // card stays white, tick fills emerald (manual look ≠ calendar look)
    expect(slot()?.classList.contains("is-on")).toBe(false);
    expect(bg(slot())).toBe("rgb(255, 255, 255)");
    expect(bg(tick())).toBe("rgb(16, 185, 129)"); // --ok #10b981
  });

  test("calendar result: green=selected renders a full emerald card", async () => {
    await render(
      <SlotCard label="10:00 – 10:30 AM" selected green onToggle={() => {}} />,
    );
    const slot = document.querySelector(".slot");
    expect(slot?.classList.contains("is-on")).toBe(true);
    expect(bg(slot)).toBe("rgb(231, 248, 241)"); // --ok-soft
  });

  test("renders a plain (non-toggle) card with custom trailing content", async () => {
    await render(
      <SlotCard
        label="3:00 – 3:30 PM"
        trailing={
          <button type="button" className="trash" aria-label="Remove">
            🗑
          </button>
        }
      />,
    );
    expect(document.querySelector(".slot")?.classList.contains("is-plain")).toBe(true);
    expect(document.querySelector('button[aria-label="Remove"]')).not.toBeNull();
  });
});

describe("DateStrip", () => {
  test("selects a day on tap (active + aria-selected)", async () => {
    function Wrap() {
      const [sel, setSel] = useState("a");
      return (
        <DateStrip
          selected={sel}
          onSelect={setSel}
          days={[
            { key: "a", weekday: "TUE", day: 17, count: 3 },
            { key: "b", weekday: "WED", day: 18 },
          ]}
        />
      );
    }
    const screen = await render(<Wrap />);
    const wed = screen.getByRole("tab", { name: /18/ });

    await expect.element(wed).toHaveAttribute("aria-selected", "false");
    await wed.click();
    await expect.element(wed).toHaveAttribute("aria-selected", "true");
    expect(
      document.querySelectorAll(".datestrip .d")[1].classList.contains("is-active"),
    ).toBe(true);
  });
});

describe("BottomSheet (AnimatePresence)", () => {
  test("opens and closes (mounts the dialog, unmounts on scrim tap)", async () => {
    function Wrap() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            open-sheet
          </button>
          <BottomSheet open={open} onClose={() => setOpen(false)} title="Add times">
            <p>sheet body</p>
          </BottomSheet>
        </>
      );
    }
    const screen = await render(<Wrap />);

    expect(document.querySelector('[role="dialog"]')).toBeNull();
    await screen.getByRole("button", { name: "open-sheet" }).click();
    await expect
      .element(screen.getByRole("dialog", { name: "Add times" }))
      .toBeVisible();

    (document.querySelector(".sheet-scrim") as HTMLElement).click();
    await expect
      .element(screen.getByRole("dialog", { name: "Add times" }))
      .not.toBeInTheDocument();
  });
});

describe("Chip", () => {
  test("supports single-select via the parent (aria-pressed)", async () => {
    function Wrap() {
      const [sel, setSel] = useState("3d");
      return (
        <div className="chips">
          {["1d", "3d", "1w"].map((o) => (
            <Chip key={o} selected={sel === o} onClick={() => setSel(o)}>
              {o}
            </Chip>
          ))}
        </div>
      );
    }
    const screen = await render(<Wrap />);
    await expect
      .element(screen.getByRole("button", { name: "3d" }))
      .toHaveAttribute("aria-pressed", "true");

    await screen.getByRole("button", { name: "1w" }).click();
    await expect
      .element(screen.getByRole("button", { name: "1w" }))
      .toHaveAttribute("aria-pressed", "true");
    await expect
      .element(screen.getByRole("button", { name: "3d" }))
      .toHaveAttribute("aria-pressed", "false");
  });
});

describe("Stepper", () => {
  test("fills `current` bars and shows the label", async () => {
    const screen = await render(<Stepper total={3} current={2} label="2/3" />);
    await expect.element(screen.getByText("2/3")).toBeVisible();
    expect(document.querySelectorAll(".stepper .bars i.on").length).toBe(2);
    expect(document.querySelectorAll(".stepper .bars i").length).toBe(3);
  });
});

describe("AvatarStack", () => {
  test("shows initials and a +N overflow chip", async () => {
    await render(
      <AvatarStack
        max={4}
        people={[
          { name: "Luis" },
          { name: "Ada" },
          { name: "Max" },
          { name: "Jo" },
          { name: "Sam" },
        ]}
      />,
    );
    const stack = document.querySelector(".avstack") as HTMLElement;
    expect(stack.getAttribute("role")).toBe("group");
    expect(stack.textContent).toContain("L");
    expect(stack.textContent).toContain("+1");
  });
});

afterEach(async () => {
  // keep a stable phone-ish viewport between tests
  await page.viewport(390, 844);
});
