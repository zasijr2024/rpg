import { expect, test } from "@playwright/test";

test("fresh-run: Hyper confirms, doubles eligible timing, persists, and toggles back to Classic", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.clock.install({ time: new Date("2026-07-11T00:00:00Z") });
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  const hyper = page.getByRole("button", { name: "hyper." });
  await hyper.click();
  const confirmation = page.getByRole("dialog", { name: "Go Hyper?" });
  await expect(confirmation).toContainText("x2 speed");
  await expect(confirmation.getByRole("button", { name: "yes" })).toBeFocused();
  await confirmation.getByRole("button", { name: "yes" }).click();
  const classic = page.getByRole("button", { name: "classic." });
  await expect(classic).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "light fire" }).click();
  const stoke = page.getByRole("button", { name: "stoke fire" });
  await expect(stoke).toBeDisabled();
  await page.clock.runFor(4_000);
  await expect(stoke).toBeDisabled();
  await page.clock.runFor(1_200);
  await expect(stoke).toBeEnabled();

  await page.reload();
  await expect(page.getByRole("button", { name: "classic." })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "classic." }).click();
  await expect(page.getByRole("button", { name: "hyper." })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(page.getByRole("dialog", { name: "Go Hyper?" })).toHaveCount(0);
});
