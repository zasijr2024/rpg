import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  resolve(process.cwd(), "../.github/workflows/remake-ci.yml"),
  "utf8",
);

describe("repository CI authority", () => {
  it("enforces the fast clean-install production lane on pushes and pull requests", () => {
    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("push:");
    expect(workflow).toContain("contents: read");
    for (const command of [
      "npm ci",
      "npm run parity:check",
      "npm run typecheck:fixtures",
      "npm test",
      "npm run lint",
      "npm run format:check",
      "npm run build",
      "npm audit --omit=dev",
      "playwright.production.config.ts --project production-chromium",
    ]) {
      expect(workflow).toContain(command);
    }
  });

  it("keeps the complete cross-browser Release Candidate gate scheduled and dispatchable", () => {
    expect(workflow).toContain("schedule:");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain(
      "npx playwright install --with-deps chromium firefox webkit",
    );
    expect(workflow).toContain("npm run gate:rc");
  });
});
