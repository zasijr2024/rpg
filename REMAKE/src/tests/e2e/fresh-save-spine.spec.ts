import { test } from "@playwright/test";
import { driveFreshSaveSpine } from "./fresh-save-spine";

test("fresh-run: controlled reachability trace reaches the ending", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-1366" &&
      !testInfo.project.name.startsWith("release-"),
  );
  test.setTimeout(
    testInfo.project.name === "release-webkit" ? 300_000 : 180_000,
  );
  await driveFreshSaveSpine(page, testInfo);
});
