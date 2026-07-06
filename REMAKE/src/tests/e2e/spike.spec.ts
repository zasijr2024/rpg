import { expect, test } from "@playwright/test";

test("renders the ASCII world viewport without horizontal overflow", async ({
  page
}) => {
  await page.goto("/?spikes=1");
  await page.getByRole("tab", { name: "world" }).click();

  const viewport = page.getByLabel("61 by 61 ASCII world viewport");
  await expect(viewport).toBeVisible();

  const metrics = await viewport.evaluate((node) => ({
    textLines: node.textContent?.trimEnd().split("\n").length,
    clientWidth: (node as HTMLElement).clientWidth,
    scrollWidth: (node as HTMLElement).scrollWidth
  }));

  expect(metrics.textLines).toBe(61);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
});

test("supports keyboard focus and world movement probe", async ({ page }) => {
  await page.goto("/?spikes=1");
  await page.getByRole("tab", { name: "world" }).click();

  const probe = page.getByRole("button", { name: /world keyboard probe/ });
  await probe.focus();
  await page.keyboard.press("ArrowRight");

  await expect(probe).toHaveText(/31,30/);
});

test("renders both space prototypes", async ({ page }) => {
  await page.goto("/?spikes=1");
  await page.getByRole("tab", { name: "space" }).click();

  await expect(page.getByLabel("Canvas space prototype")).toBeVisible();
  await expect(page.getByLabel("DOM space prototype")).toBeVisible();
});
