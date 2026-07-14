import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  inspectStaticGate,
  loadGateConfig,
  parsePackageStatuses,
} from "./release-gates.mjs";

const scriptDirectory = resolve(fileURLToPath(import.meta.url), "..");
const defaultProjectRoot = resolve(scriptDirectory, "..");

function readText(path) {
  return readFileSync(path, "utf8");
}

function git(projectRoot, args) {
  return execFileSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
  }).trim();
}

export function phaseOwnedOpenIds(planning, phaseId = "RA-2026-07-09") {
  const ownedId = phaseId.startsWith("P14V-")
    ? /^(?:RA-(?:CTRL|P\d+)|P14[RV])-\d+$/u
    : /^RA-(?:CTRL|P\d+)-\d+$/u;
  return [...parsePackageStatuses(planning)]
    .filter(
      ([id, status]) => ownedId.test(id) && !/^done(?:\s|$)/u.test(status),
    )
    .map(([id]) => id)
    .sort();
}

export function inspectPhaseClosure({
  phaseId,
  revision,
  planning,
  checklist,
  deviations,
  worktreeStatus,
  gateConfig,
  tag,
  tagMatchesHead = true,
}) {
  const inputs = { planning, checklist, deviations, worktreeStatus };
  const gates = gateConfig.gates.map((gate) => {
    const result = inspectStaticGate(gateConfig, gate.id, inputs);
    return {
      id: gate.id,
      label: gate.label,
      status: result.blockers.length === 0 ? "READY" : "BLOCKED",
      blockers: result.blockers,
    };
  });
  const openIds = phaseOwnedOpenIds(planning, phaseId);
  const worktreeClean = worktreeStatus.trim() === "";
  const closureStatus = tag
    ? openIds.length === 0 && tagMatchesHead && worktreeClean
      ? "PASS"
      : "BLOCKED"
    : openIds.length === 0
      ? "READY"
      : "BLOCKED";

  return {
    phase: phaseId,
    revision,
    tag: tag ?? null,
    worktree: worktreeClean ? "clean" : "dirty",
    tagMatchesHead: tag ? tagMatchesHead : null,
    phaseOwnedOpenIds: openIds,
    gates,
    status: closureStatus,
  };
}

function trackedText(projectRoot, revision, path) {
  const repositoryRoot = git(projectRoot, ["rev-parse", "--show-toplevel"]);
  const repositoryPath = relative(
    repositoryRoot,
    resolve(projectRoot, path),
  ).replace(/\\/gu, "/");
  return git(projectRoot, ["show", `${revision}:${repositoryPath}`]);
}

function closureInputs(projectRoot, tag) {
  const revision = tag
    ? git(projectRoot, ["rev-parse", `${tag}^{commit}`])
    : git(projectRoot, ["rev-parse", "HEAD"]);
  const head = git(projectRoot, ["rev-parse", "HEAD"]);
  const read = (path) =>
    tag
      ? trackedText(projectRoot, revision, path)
      : readText(resolve(projectRoot, path));
  let worktreeStatus;
  try {
    worktreeStatus = git(projectRoot, ["status", "--porcelain"]);
  } catch (error) {
    worktreeStatus = `git status failed: ${error.message}`;
  }
  const planningPaths = [
    "docs/planning.md",
    "docs/status/phase-14-release-readiness-plan-2026-07-12.md",
  ];
  return {
    revision,
    planning: planningPaths.map(read).join("\n"),
    checklist: read("docs/parity-checklist.md"),
    deviations: read("docs/deviations.md"),
    worktreeStatus,
    tagMatchesHead: !tag || revision === head,
  };
}

function report(result, json) {
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  process.stdout.write(`Phase closure report: ${result.status}\n`);
  process.stdout.write(`Phase: ${result.phase}\n`);
  process.stdout.write(`Revision: ${result.revision}\n`);
  if (result.tag) {
    process.stdout.write(
      `Tag: ${result.tag} (${result.tagMatchesHead ? "HEAD" : "not HEAD"})\n`,
    );
  }
  process.stdout.write(`Worktree: ${result.worktree}\n`);
  if (result.phaseOwnedOpenIds.length === 0) {
    process.stdout.write("Phase-owned open IDs: none\n");
  } else {
    process.stdout.write(
      `Phase-owned open IDs (${result.phaseOwnedOpenIds.length}): ${result.phaseOwnedOpenIds.join(", ")}\n`,
    );
  }
  process.stdout.write("Gate results:\n");
  for (const gate of result.gates) {
    process.stdout.write(
      `- ${gate.label}: ${gate.status}${gate.blockers.length ? ` (${gate.blockers.length} blockers)` : ""}\n`,
    );
  }
}

function argumentValue(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

export function main(
  args = process.argv.slice(2),
  projectRoot = defaultProjectRoot,
) {
  const tag = argumentValue(args, "--tag");
  if (args.includes("--tag") && !tag) {
    throw new Error(
      "Usage: node scripts/phase-closure.mjs [--tag <closure-tag>] [--json]",
    );
  }
  const inputs = closureInputs(projectRoot, tag);
  const result = inspectPhaseClosure({
    phaseId: "P14V-2026-07-12",
    ...inputs,
    tag,
    gateConfig: loadGateConfig(projectRoot),
  });
  report(result, args.includes("--json"));
  return tag && result.status !== "PASS" ? 1 : 0;
}

const isMain =
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  try {
    process.exitCode = main();
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 2;
  }
}
