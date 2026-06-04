import { render } from "vitest-browser-react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ShareScreen } from "@/components/event/share-screen";

const URL = "https://timy.app/event/abc123";

let writeText: ReturnType<typeof vi.fn>;
let shareSpy: ReturnType<typeof vi.fn>;
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
const originalShare = Object.getOwnPropertyDescriptor(navigator, "share");

beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
  shareSpy = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
    writable: true,
  });
  Object.defineProperty(navigator, "share", {
    value: shareSpy,
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  if (originalClipboard) Object.defineProperty(navigator, "clipboard", originalClipboard);
  if (originalShare) Object.defineProperty(navigator, "share", originalShare);
});

describe("ShareScreen", () => {
  test("shows the success state and invite link", async () => {
    const screen = await render(<ShareScreen inviteUrl={URL} onFillOut={() => {}} />);
    await expect.element(screen.getByText("Your poll is ready")).toBeVisible();
    await expect.element(screen.getByText(URL)).toBeVisible();
  });

  test("Copy writes the invite link to the clipboard", async () => {
    const screen = await render(<ShareScreen inviteUrl={URL} onFillOut={() => {}} />);
    await screen.getByRole("button", { name: "Copy invite link" }).click();
    expect(writeText).toHaveBeenCalledWith(URL);
    await expect.element(screen.getByText("Copied!")).toBeVisible();
  });

  test("Share invokes the Web Share API with the invite link", async () => {
    const screen = await render(<ShareScreen inviteUrl={URL} onFillOut={() => {}} />);
    await screen.getByRole("button", { name: /Share/ }).click();
    expect(shareSpy).toHaveBeenCalledOnce();
    expect(shareSpy.mock.calls[0][0]).toMatchObject({ url: URL });
  });

  test("Fill out my availability routes the host into voting", async () => {
    const onFillOut = vi.fn();
    const screen = await render(<ShareScreen inviteUrl={URL} onFillOut={onFillOut} />);
    await screen.getByRole("button", { name: /Fill out/ }).click();
    expect(onFillOut).toHaveBeenCalledOnce();
  });
});
