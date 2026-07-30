import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  resolve(process.cwd(), "../.github/workflows/remake-ci.yml"),
  "utf8",
).replaceAll("\r\n", "\n");
const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
) as { scripts: Record<string, string> };
const productionConfig = readFileSync(
  resolve(process.cwd(), "playwright.production.config.ts"),
  "utf8",
);

function section(start: string, end: string): string {
  const startIndex = workflow.indexOf(start);
  const endIndex = workflow.indexOf(end, startIndex + start.length);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return workflow.slice(startIndex, endIndex);
}

describe("repository CI authority", () => {
  it("reports a stable required result on every pull request", () => {
    const pullRequestTrigger = section("  pull_request:\n", "  push:\n");
    const pushTrigger = section("  push:\n", "  schedule:\n");
    const scopeJob = section("  scope:\n", "  verify:\n");
    const verifyJob = section("  verify:\n", "  required:\n");
    const requiredJob = section("  required:\n", "  release-candidate:\n");

    expect(pullRequestTrigger.trim()).toBe("pull_request:");
    expect(pushTrigger).toContain('- ".gitmodules"');
    expect(scopeJob).toContain("fetch-depth: 0");
    expect(scopeJob).toContain("working-directory: ${{ github.workspace }}");
    expect(scopeJob).toContain("git diff --name-only --diff-filter=ACDMRTUXB");
    expect(scopeJob).toContain(
      "^(\\.github/workflows/remake-ci\\.yml$|\\.gitmodules$|DATA/|ORIGINAL/|REMAKE/)",
    );
    expect(verifyJob).toContain("needs: scope");
    expect(verifyJob).toContain("if: needs.scope.outputs.remake == 'true'");
    expect(requiredJob).toContain("name: Remake CI required");
    expect(requiredJob).toContain("needs: [scope, verify]");
    expect(requiredJob).toContain(
      "if: always() && github.event_name == 'pull_request'",
    );
    expect(requiredJob).toContain('[[ "$SCOPE_RESULT" != "success" ]]');
    expect(requiredJob).toContain('[[ "$VERIFY_RESULT" != "success" ]]');
    expect(requiredJob).toContain('[[ "$VERIFY_RESULT" != "skipped" ]]');
  });

  it("enforces the clean-install cross-browser production lane for in-scope changes", () => {
    const verifyJob = section("  verify:\n", "  required:\n");

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
      "npx playwright install --with-deps chromium firefox webkit",
      "npm run test:e2e:production",
    ]) {
      expect(verifyJob).toContain(command);
    }
    expect(packageJson.scripts["test:e2e:production"]).toBe(
      "playwright test --config playwright.production.config.ts",
    );
    for (const project of [
      "production-chromium",
      "production-firefox",
      "production-webkit",
    ]) {
      expect(productionConfig).toContain(`name: "${project}"`);
    }
  });

  it("pins every third-party action to an immutable commit", () => {
    const actionUses = [...workflow.matchAll(/^\s*uses:\s*([^\s#]+)/gm)].map(
      (match) => match[1],
    );
    expect(actionUses.length).toBeGreaterThan(0);
    for (const action of actionUses) {
      expect(action).toMatch(/^[^@]+@[a-f0-9]{40}$/);
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
