import { render } from "vitest-browser-react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  CreateDraftProvider,
  useCreateDraft,
} from "@/components/create/create-draft-context";

function Harness() {
  const { draft, ready, update, reset } = useCreateDraft();
  return (
    <div>
      <div data-testid="title">{draft.title}</div>
      <div data-testid="id">{draft.id}</div>
      <div data-testid="ready">{ready ? "ready" : "loading"}</div>
      <button type="button" onClick={() => update({ title: "Team Standup" })}>
        set-title
      </button>
      <button type="button" onClick={() => reset()}>
        reset
      </button>
    </div>
  );
}

const text = (id: string) =>
  (document.querySelector(`[data-testid="${id}"]`) as HTMLElement | null)
    ?.textContent ?? "";

beforeEach(() => sessionStorage.clear());
afterEach(() => sessionStorage.clear());

describe("CreateDraftProvider", () => {
  test("starts ready with an empty, real draft when storage is empty", async () => {
    const screen = await render(
      <CreateDraftProvider>
        <Harness />
      </CreateDraftProvider>,
    );
    await expect.element(screen.getByTestId("ready")).toHaveTextContent("ready");
    expect(text("title")).toBe("");
    expect(text("id")).not.toBe("pending");
    expect(text("id").length).toBeGreaterThan(0);
  });

  test("persists edits across an unmount/remount (refresh)", async () => {
    const first = await render(
      <CreateDraftProvider>
        <Harness />
      </CreateDraftProvider>,
    );
    await first.getByRole("button", { name: "set-title" }).click();
    await expect.element(first.getByTestId("title")).toHaveTextContent("Team Standup");
    const id = text("id");

    first.unmount(); // refresh: in-memory state gone, sessionStorage kept

    const second = await render(
      <CreateDraftProvider>
        <Harness />
      </CreateDraftProvider>,
    );
    await expect
      .element(second.getByTestId("title"))
      .toHaveTextContent("Team Standup");
    expect(text("id")).toBe(id); // same draft resumed
  });

  test("reset clears the draft and starts a new one", async () => {
    const screen = await render(
      <CreateDraftProvider>
        <Harness />
      </CreateDraftProvider>,
    );
    await screen.getByRole("button", { name: "set-title" }).click();
    await expect.element(screen.getByTestId("title")).toHaveTextContent("Team Standup");
    const oldId = text("id");

    await screen.getByRole("button", { name: "reset" }).click();
    // wait for the new (empty) draft id to differ
    await expect.element(screen.getByTestId("id")).not.toHaveTextContent(oldId);
    expect(text("title")).toBe("");
  });
});
