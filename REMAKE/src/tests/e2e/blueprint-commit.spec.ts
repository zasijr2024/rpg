import { expect, test, type Page } from "@playwright/test";

async function getState<T>(page: Page, path: string): Promise<T> {
  return page.evaluate(
    (statePath) => window.__adrTest?.getState(statePath),
    path,
  ) as Promise<T>;
}

const BLUEPRINTS = [
  ["hypo blueprint", "hypo"],
  ["kinetic armour blueprint", "kinetic armour"],
  ["disruptor blueprint", "disruptor"],
  ["plasma rifle blueprint", "plasma rifle"],
  ["stim blueprint", "stim"],
  ["glowstone blueprint", "glowstone"],
] as const;

test("scenario-seeded: all carried blueprints redeem only on village return", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1&testSeed=blueprint-commit");
  await page.getByRole("tab", { name: "world" }).click();

  for (const [, item] of BLUEPRINTS) {
    expect(
      await getState(page, `character.blueprints["${item}"]`),
    ).toBeUndefined();
  }
  await page.getByRole("button", { name: "return" }).click();

  await expect(page.getByRole("tab", { name: "A Dusty Path" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  for (const [blueprint, item] of BLUEPRINTS) {
    expect(await getState(page, `character.blueprints["${item}"]`)).toBe(true);
    expect(await getState(page, `outfit["${blueprint}"]`)).toBeUndefined();
  }
});

test("scenario-seeded: death discards every carried blueprint before commit", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1366");
  await page.goto("/?testHarness=1&testSeed=blueprint-death");
  await page.getByRole("tab", { name: "world" }).click();
  await page.getByRole("button", { name: "east" }).click();
  await page.getByRole("button", { name: "south" }).click();

  await expect(page.getByRole("tab", { name: /A .*Room/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  for (const [blueprint, item] of BLUEPRINTS) {
    expect(
      await getState(page, `character.blueprints["${item}"]`),
    ).toBeUndefined();
    expect(await getState(page, `outfit["${blueprint}"]`)).toBeUndefined();
  }
});
