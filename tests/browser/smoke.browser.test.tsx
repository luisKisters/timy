import { render } from "vitest-browser-react";
import { expect, test } from "vitest";

function Hello({ name }: { name: string }) {
  return <button type="button">Hello {name}</button>;
}

// Smoke test: confirms the `browser` project renders React in a real chromium
// instance via vitest-browser-react and that locator-based assertions work.
test("renders a React component in chromium", async () => {
  const screen = await render(<Hello name="Timy" />);
  await expect
    .element(screen.getByRole("button", { name: "Hello Timy" }))
    .toBeVisible();
});
