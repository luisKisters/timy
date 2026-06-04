import { useState } from "react";
import { render } from "vitest-browser-react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { SetupScreen, type SetupValue } from "@/components/create/setup-screen";
import { SetupConnected } from "@/components/create/setup-connected";
import { CreateDraftProvider } from "@/components/create/create-draft-context";
import { getActiveDraftId, loadDraft } from "@/lib/create-draft";

function Harness({ onContinue = () => {} }: { onContinue?: () => void }) {
  const [v, setV] = useState<SetupValue>({
    title: "",
    hostName: "",
    expiry: "3 days",
    slotLengthMin: 30,
  });
  return (
    <SetupScreen
      value={v}
      onChange={(p) => setV((s) => ({ ...s, ...p }))}
      onContinue={onContinue}
      onBack={() => {}}
    />
  );
}

describe("SetupScreen", () => {
  test("Continue is disabled until the meeting is named", async () => {
    const screen = await render(<Harness />);
    const cont = screen.getByRole("button", { name: /Continue/ });
    await expect.element(cont).toBeDisabled();

    await screen.getByRole("textbox", { name: "Meeting name" }).fill("Team Standup");
    await expect.element(cont).toBeEnabled();
  });

  test("poll-closes chips are single-select", async () => {
    const screen = await render(<Harness />);
    await expect
      .element(screen.getByRole("button", { name: "3 days" }))
      .toHaveAttribute("aria-pressed", "true");

    await screen.getByRole("button", { name: "1 week" }).click();
    await expect
      .element(screen.getByRole("button", { name: "1 week" }))
      .toHaveAttribute("aria-pressed", "true");
    await expect
      .element(screen.getByRole("button", { name: "3 days" }))
      .toHaveAttribute("aria-pressed", "false");
  });

  test("invokes onContinue once enabled", async () => {
    const onContinue = vi.fn();
    const screen = await render(<Harness onContinue={onContinue} />);
    await screen.getByRole("textbox", { name: "Meeting name" }).fill("Lunch");
    await screen.getByRole("button", { name: /Continue/ }).click();
    expect(onContinue).toHaveBeenCalledOnce();
  });
});

describe("SetupConnected (writes to the draft)", () => {
  beforeEach(() => sessionStorage.clear());

  test("persists name, host, expiry and slot length to the draft", async () => {
    const onContinue = vi.fn();
    const screen = await render(
      <CreateDraftProvider>
        <SetupConnected onContinue={onContinue} onBack={() => {}} />
      </CreateDraftProvider>,
    );

    await screen.getByRole("textbox", { name: "Meeting name" }).fill("Team Standup");
    await screen.getByRole("textbox", { name: "Your name" }).fill("Luis");
    await screen.getByRole("button", { name: "1 week" }).click();
    await screen.getByRole("button", { name: "60 min" }).click();

    // Continue becomes enabled once named → a good barrier before reading state
    await expect
      .element(screen.getByRole("button", { name: /Continue/ }))
      .toBeEnabled();

    const id = getActiveDraftId(sessionStorage);
    expect(id).toBeTruthy();
    const draft = loadDraft(sessionStorage, id as string);
    expect(draft?.title).toBe("Team Standup");
    expect(draft?.hostName).toBe("Luis");
    expect(draft?.expiry).toBe("1 week");
    expect(draft?.slotLengthMin).toBe(60);

    await screen.getByRole("button", { name: /Continue/ }).click();
    expect(onContinue).toHaveBeenCalledOnce();
  });
});
