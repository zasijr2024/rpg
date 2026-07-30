import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

const WCAG_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
] as const;

function isExplainedSeriousIncomplete(
  incomplete: Awaited<ReturnType<AxeBuilder["analyze"]>>["incomplete"][number],
) {
  // Axe cannot calculate contrast through generated labels, gradients, and
  // canvas-adjacent visual layers. Keep those cases in the attached artifact
  // for human review; every other serious incomplete is a release failure.
  return (
    incomplete.id === "color-contrast" &&
    incomplete.nodes.every((node) =>
      node.failureSummary
        ?.toLowerCase()
        .includes("background color could not be determined"),
    )
  );
}

async function expectNoAccessibilityViolations(
  page: Page,
  testInfo: TestInfo,
  artifactName: string,
) {
  const results = await new AxeBuilder({ page })
    .withTags([...WCAG_TAGS])
    .analyze();

  await testInfo.attach(`${artifactName}.json`, {
    body: Buffer.from(
      JSON.stringify(
        {
          url: results.url,
          testEngine: results.testEngine,
          testEnvironment: results.testEnvironment,
          passes: results.passes.map(({ id, impact }) => ({ id, impact })),
          incomplete: results.incomplete.map(({ id, impact, nodes }) => ({
            id,
            impact,
            nodes: nodes.map(({ target, failureSummary }) => ({
              target,
              failureSummary,
            })),
          })),
          violations: results.violations,
        },
        null,
        2,
      ),
    ),
    contentType: "application/json",
  });

  const unexplainedSeriousIncomplete = results.incomplete.filter(
    (incomplete) =>
      (incomplete.impact === "serious" || incomplete.impact === "critical") &&
      !isExplainedSeriousIncomplete(incomplete),
  );

  expect(
    unexplainedSeriousIncomplete,
    unexplainedSeriousIncomplete
      .map(
        ({ id, nodes }) =>
          `${id}: serious accessibility result was not explained\n${nodes
            .map(
              ({ target, failureSummary }) =>
                `  ${target.join(" ")}: ${failureSummary ?? "no summary"}`,
            )
            .join("\n")}`,
      )
      .join("\n"),
  ).toEqual([]);

  expect(
    results.violations,
    results.violations
      .map(
        ({ id, help, nodes }) =>
          `${id}: ${help}\n${nodes
            .map(({ target }) => `  ${target.join(" ")}`)
            .join("\n")}`,
      )
      .join("\n"),
  ).toEqual([]);
}

test("fresh-run: release accessibility smoke covers the primary room and live log", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: "light fire" }).click();
  await expect(page.getByRole("log", { name: "notifications" })).toContainText(
    "the light from the fire spills",
  );

  await expectNoAccessibilityViolations(page, testInfo, "axe-room");
});

test("scenario-seeded: notification history keeps every visible age contrast-safe", async ({
  page,
}, testInfo) => {
  await page.goto("/?testHarness=1");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          "__adrTest" in window &&
          Boolean((window as Window & { __adrTest?: unknown }).__adrTest),
      ),
    )
    .toBe(true);
  for (let index = 0; index < 8; index += 1) {
    await page.getByRole("button", { name: "light fire" }).click();
    if (index < 7) {
      await page.evaluate(() => {
        const harness = (
          window as Window & {
            __adrTest?: {
              setState: (path: string, value: unknown) => void;
              refresh: () => void;
            };
          }
        ).__adrTest;
        if (!harness) throw new Error("test harness unavailable");
        harness.setState("game.fire", { value: 0, text: "dead" });
        harness.refresh();
      });
    }
  }
  const log = page.getByRole("log", { name: "notifications" });
  await expect(log.locator("p")).toHaveCount(8);

  await expectNoAccessibilityViolations(
    page,
    testInfo,
    "axe-notification-history",
  );
});

test("scenario-seeded: release accessibility smoke covers the compact World model", async ({
  page,
}, testInfo) => {
  await page.goto("/?testHarness=1&testSeed=world-accessibility");
  await page.getByRole("tab", { name: "world" }).click();

  const information = page.getByRole("region", { name: "world information" });
  await expect(information).toContainText("x 30, y 30; the village");
  await expect(page.locator(".worldMapStage")).toHaveAttribute(
    "aria-hidden",
    "true",
  );

  await expectNoAccessibilityViolations(page, testInfo, "axe-world");
});

test("scenario-seeded: release accessibility smoke covers an active combat dialog", async ({
  page,
}, testInfo) => {
  await page.goto("/?testHarness=1&testSeed=stim-lifecycle");

  const dialog = page.getByRole("dialog", { name: "event" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "stab" })).toBeFocused();

  await expectNoAccessibilityViolations(page, testInfo, "axe-combat-dialog");
});

test("scenario-seeded: release accessibility smoke covers the optional Space feed", async ({
  page,
}, testInfo) => {
  await page.goto("/?testHarness=1&testSeed=space-slice");
  await page.getByRole("tab", { name: "An Old Starship" }).click();
  const ship = page.getByRole("region", { name: "An Old Starship" });
  const reinforce = ship.getByRole("button", { name: /reinforce hull/ });
  for (let alloy = 0; alloy < 6; alloy += 1) await reinforce.click();
  await ship.getByRole("button", { name: "lift off", exact: true }).click();
  await ship
    .getByRole("region", { name: "Ready to Leave?" })
    .getByRole("button", { name: "lift off" })
    .click();

  const flight = page.getByRole("region", { name: "space flight" });
  await flight
    .getByRole("button", { name: "turn spatial flight feed on" })
    .click();
  const feed = flight.getByRole("region", { name: "spatial flight feed" });
  await expect(feed).toContainText("ship position:");
  await expect(feed).toContainText("nearest debris:");
  await expect(feed).toContainText("collision threat:");

  await expectNoAccessibilityViolations(page, testInfo, "axe-space-feed");
});
