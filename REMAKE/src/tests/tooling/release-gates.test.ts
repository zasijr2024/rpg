import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  inspectParityChecklist,
  inspectStaticGate,
  loadGateConfig,
  parsePackageStatuses,
  resolveGateLayers,
  runCommands,
  validateGateGraph,
} from "../../../scripts/release-gates.mjs";
import {
  inspectPhaseClosure,
  phaseOwnedOpenIds,
} from "../../../scripts/phase-closure.mjs";

const projectRoot = process.cwd();
const config = loadGateConfig(projectRoot);
const planning = readFileSync(resolve(projectRoot, "docs/planning.md"), "utf8");
const releaseReadiness = readFileSync(
  resolve(
    projectRoot,
    "docs/status/phase-14-release-readiness-plan-2026-07-12.md",
  ),
  "utf8",
);
const checklist = readFileSync(
  resolve(projectRoot, "docs/parity-checklist.md"),
  "utf8",
);
const deviations = readFileSync(
  resolve(projectRoot, "docs/deviations.md"),
  "utf8",
);

describe("release gate separation", () => {
  it("defines three distinct hierarchical gates without command duplication", () => {
    expect(config.gates.map(({ id }) => id)).toEqual([
      "parity-complete",
      "production-beta",
      "release-candidate",
    ]);
    expect(
      resolveGateLayers(config, "release-candidate").map(({ id }) => id),
    ).toEqual(["parity-complete", "production-beta", "release-candidate"]);

    const commandIds = resolveGateLayers(config, "release-candidate").flatMap(
      (gate) => gate.commands.map(({ id }) => id),
    );
    expect(new Set(commandIds).size).toBe(commandIds.length);
  });

  it("rejects unknown parents and inheritance cycles", () => {
    expect(() =>
      validateGateGraph([{ ...config.gates[0], inherits: ["missing"] }]),
    ).toThrow("Unknown inherited release gate");
    expect(() =>
      validateGateGraph([
        { ...config.gates[0], id: "one", inherits: ["two"] },
        { ...config.gates[1], id: "two", inherits: ["one"] },
      ]),
    ).toThrow("inheritance cycle");
    expect(() =>
      validateGateGraph([
        config.gates[0],
        {
          ...config.gates[1],
          commands: [config.gates[0].commands[0]],
        },
      ]),
    ).toThrow("release gate command id");
    expect(() =>
      validateGateGraph([{ ...config.gates[0], checks: ["wishful-thinking"] }]),
    ).toThrow("Unknown static release gate check");
  });

  it("parses only package rows and preserves their current ledger state", () => {
    const statuses = parsePackageStatuses(planning);
    expect(statuses.get("RA-P1-16")).toBe("done");
    expect(statuses.get("RA-P1-04")).toBe(
      "done (reopened and corrected 2026-07-10)",
    );
    expect(statuses.get("RA-P2-01")).toBe("done");
    expect(statuses.get("RA-P2-02")).toBe("done");
    expect(statuses.get("RA-P2-03")).toBe("done");
    expect(statuses.get("RA-P2-04")).toBe("done");
    expect(statuses.get("RA-P2-05")).toBe("done");
    expect(statuses.get("RA-P2-06")).toBe("done");
    expect(statuses.get("RA-P2-07")).toBe("done");
    expect(statuses.get("P14R-06")).toContain("pending p14v-07");
    expect(parsePackageStatuses(releaseReadiness).get("P14V-01")).toBe("done");
  });

  it("blocks unresolved checklist fixtures and accepts the completed parity ledger", () => {
    const result = inspectParityChecklist(checklist, deviations);
    expect(result.unresolved).toEqual([]);
    expect(result.deviationsWithoutEvidence).toEqual([]);

    const unresolvedFixture = [
      "- [ ] still open",
      "- [~] still partial",
      "- [!] intentional. See `REMAKE/docs/deviations.md#dev-001-example`.",
    ].join("\n");
    const unresolved = inspectParityChecklist(
      unresolvedFixture,
      "### DEV-001: Example",
    );
    expect(unresolved.unresolved.map(({ status }) => status)).toEqual([
      "open",
      "partial",
    ]);
    expect(unresolved.deviationsWithoutEvidence).toEqual([]);

    const completeFixture = [
      "- [x] implemented",
      "- [!] intentional. See `REMAKE/docs/deviations.md#dev-001-example`.",
    ].join("\n");
    expect(
      inspectParityChecklist(completeFixture, "### DEV-001: Example"),
    ).toEqual({ unresolved: [], deviationsWithoutEvidence: [] });
  });

  it("keeps Beta and Release Candidate blocked by their own package evidence", () => {
    const inputs = { planning, checklist, deviations, worktreeStatus: "" };
    const beta = inspectStaticGate(config, "production-beta", inputs);
    const candidate = inspectStaticGate(config, "release-candidate", inputs);

    expect(beta.blockers).not.toContainEqual(
      expect.objectContaining({ id: "RA-P2-02" }),
    );
    expect(beta.blockers).not.toContainEqual(
      expect.objectContaining({ id: "RA-P2-05" }),
    );
    expect(beta.blockers).not.toContainEqual(
      expect.objectContaining({ id: "RA-P2-06" }),
    );
    expect(beta.blockers).not.toContainEqual(
      expect.objectContaining({ id: "RA-P2-07" }),
    );
    expect(beta.blockers).not.toContainEqual(
      expect.objectContaining({ id: "RA-P2-03" }),
    );
    expect(candidate.blockers).not.toContainEqual(
      expect.objectContaining({ id: "RA-P2-03" }),
    );
    expect(candidate.blockers).not.toContainEqual(
      expect.objectContaining({ id: "RA-P2-08" }),
    );
  });

  it("adds repository cleanliness only to the Release Candidate gate", () => {
    const inputs = {
      planning,
      checklist,
      deviations,
      worktreeStatus: " M release-gates.json\n",
    };
    expect(
      inspectStaticGate(config, "production-beta", inputs).blockers,
    ).not.toContainEqual(expect.objectContaining({ id: "clean-worktree" }));
    expect(
      inspectStaticGate(config, "release-candidate", inputs).blockers,
    ).toContainEqual(expect.objectContaining({ id: "clean-worktree" }));
  });

  it("runs production browser performance budgets as a Beta-only command", () => {
    const betaCommands = resolveGateLayers(config, "production-beta").flatMap(
      ({ commands }) => commands,
    );
    expect(betaCommands).toContainEqual({
      id: "production-performance-budgets",
      command: "npm run test:e2e:performance",
    });
  });

  it("requires a complete externally driven production spine for Release Candidate", () => {
    const candidateCommands = resolveGateLayers(
      config,
      "release-candidate",
    ).flatMap(({ commands }) => commands);
    expect(candidateCommands).toContainEqual({
      id: "production-complete-spine",
      command: "npm run test:e2e:production-spine",
    });
    expect(candidateCommands).toContainEqual({
      id: "progression-policy-diagnostic",
      command: "npm run study:progression",
    });
  });

  it("executes a ready command and records its exit status", () => {
    expect(
      runCommands(
        [{ id: "node-smoke", command: "node --version" }],
        projectRoot,
      ),
    ).toEqual([
      expect.objectContaining({
        id: "node-smoke",
        status: "passed",
        exitCode: 0,
      }),
    ]);
  });

  it("reports the revision, phase-owned open IDs, and every gate's static result", () => {
    const pendingPlanning = planning.replace(
      /^(\|\s*RA-P2-08\s*\|.*\|)\s*done\s*\|\s*$/m,
      "$1 pending |",
    );
    expect(pendingPlanning).not.toBe(planning);
    const report = inspectPhaseClosure({
      phaseId: "RA-2026-07-09",
      revision: "abc123",
      planning: pendingPlanning,
      checklist,
      deviations,
      worktreeStatus: "",
      gateConfig: config,
    });

    expect(report).toMatchObject({
      phase: "RA-2026-07-09",
      revision: "abc123",
      status: "BLOCKED",
      phaseOwnedOpenIds: ["RA-P2-08"],
    });
    expect(report.gates.map(({ id, status }) => ({ id, status }))).toEqual([
      { id: "parity-complete", status: "READY" },
      { id: "production-beta", status: "READY" },
      { id: "release-candidate", status: "BLOCKED" },
    ]);
  });

  it("accepts a clean HEAD closure tag only when no remediation package is open", () => {
    expect(phaseOwnedOpenIds(planning)).toEqual([]);
    expect(
      inspectPhaseClosure({
        phaseId: "RA-2026-07-09",
        revision: "abc123",
        planning,
        checklist,
        deviations,
        worktreeStatus: "",
        gateConfig: config,
        tag: "ra-2026-07-09-closure",
        tagMatchesHead: true,
      }).status,
    ).toBe("PASS");
    expect(
      inspectPhaseClosure({
        phaseId: "RA-2026-07-09",
        revision: "abc123",
        planning,
        checklist,
        deviations,
        worktreeStatus: " M docs/planning.md\n",
        gateConfig: config,
        tag: "ra-2026-07-09-closure",
        tagMatchesHead: true,
      }).status,
    ).toBe("BLOCKED");
  });

  it("fails closed for open Phase 14 roast and release-readiness packages", () => {
    const phase14Planning = `${planning}\n${releaseReadiness}`;
    expect(phaseOwnedOpenIds(phase14Planning, "P14V-2026-07-12")).toEqual([
      "P14R-06",
      "P14R-09",
      "P14V-02",
      "P14V-03",
      "P14V-05",
      "P14V-06",
      "P14V-07",
      "P14V-08",
      "P14V-09",
    ]);
    expect(
      inspectPhaseClosure({
        phaseId: "P14V-2026-07-12",
        revision: "abc123",
        planning: phase14Planning,
        checklist,
        deviations,
        worktreeStatus: "",
        gateConfig: config,
        tag: "rc-test",
        tagMatchesHead: true,
      }).status,
    ).toBe("BLOCKED");
  });
});
