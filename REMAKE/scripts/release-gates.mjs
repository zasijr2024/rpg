import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const defaultProjectRoot = resolve(scriptDirectory, "..");

function readText(path) {
  return readFileSync(path, "utf8");
}

export function loadGateConfig(projectRoot = defaultProjectRoot) {
  const config = JSON.parse(
    readText(resolve(projectRoot, "release-gates.json")),
  );
  if (config.schemaVersion !== 1 || !Array.isArray(config.gates)) {
    throw new Error("Unsupported release gate configuration.");
  }
  validateGateGraph(config.gates);
  return config;
}

export function validateGateGraph(gates) {
  const ids = new Set();
  const commandIds = new Set();
  const supportedChecks = new Set(["parity-checklist", "clean-worktree"]);
  for (const gate of gates) {
    if (!gate.id || ids.has(gate.id)) {
      throw new Error(
        `Duplicate or missing release gate id: ${gate.id ?? "<missing>"}`,
      );
    }
    ids.add(gate.id);
    for (const check of gate.checks ?? []) {
      if (!supportedChecks.has(check)) {
        throw new Error(`Unknown static release gate check: ${check}.`);
      }
    }
    for (const command of gate.commands ?? []) {
      if (!command.id || commandIds.has(command.id)) {
        throw new Error(
          `Duplicate or missing release gate command id: ${command.id ?? "<missing>"}.`,
        );
      }
      commandIds.add(command.id);
    }
  }

  const byId = new Map(gates.map((gate) => [gate.id, gate]));
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id))
      throw new Error(`Release gate inheritance cycle at ${id}.`);
    if (visited.has(id)) return;
    const gate = byId.get(id);
    if (!gate) throw new Error(`Unknown inherited release gate: ${id}.`);
    visiting.add(id);
    for (const parent of gate.inherits ?? []) visit(parent);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of ids) visit(id);
}

export function resolveGateLayers(config, gateId) {
  const byId = new Map(config.gates.map((gate) => [gate.id, gate]));
  if (!byId.has(gateId)) throw new Error(`Unknown release gate: ${gateId}.`);
  const ordered = [];
  const added = new Set();
  function add(id) {
    if (added.has(id)) return;
    const gate = byId.get(id);
    for (const parent of gate.inherits ?? []) add(parent);
    ordered.push(gate);
    added.add(id);
  }
  add(gateId);
  return ordered;
}

export function parsePackageStatuses(markdown) {
  const statuses = new Map();
  for (const line of markdown.split(/\r?\n/u)) {
    const match = line.match(
      /^\|\s*((?:RA-(?:CTRL|P\d+)|P14[RV])-\d+)\s*\|.*\|\s*([^|]+?)\s*\|\s*$/u,
    );
    if (match) statuses.set(match[1], match[2].trim().toLowerCase());
  }
  return statuses;
}

function markdownHeadingAnchor(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/gu, "-")
    .replace(/-+/gu, "-");
}

export function inspectParityChecklist(checklist, deviations) {
  const unresolved = [];
  const deviationsWithoutEvidence = [];
  const deviationAnchors = new Set(
    deviations
      .split(/\r?\n/u)
      .filter((line) => /^#{1,6}\s+/u.test(line))
      .map((line) => markdownHeadingAnchor(line.replace(/^#{1,6}\s+/u, ""))),
  );

  for (const [index, line] of checklist.split(/\r?\n/u).entries()) {
    const item = line.match(/^- \[([ x~!])\]\s+(.+)$/u);
    if (!item) continue;
    if (item[1] === " " || item[1] === "~") {
      unresolved.push({
        line: index + 1,
        status: item[1] === " " ? "open" : "partial",
        text: item[2],
      });
    }
    if (item[1] === "!") {
      const link = item[2].match(/REMAKE\/docs\/deviations\.md#([a-z0-9-]+)/u);
      if (!link || !deviationAnchors.has(link[1])) {
        deviationsWithoutEvidence.push({ line: index + 1, text: item[2] });
      }
    }
  }
  return { unresolved, deviationsWithoutEvidence };
}

function unique(items) {
  return [...new Set(items)];
}

export function inspectStaticGate(config, gateId, inputs) {
  const layers = resolveGateLayers(config, gateId);
  const blockers = [];
  const packageIds = unique(
    layers.flatMap((gate) => gate.requiredPackages ?? []),
  );
  const checks = unique(layers.flatMap((gate) => gate.checks ?? []));
  const packageStatuses = parsePackageStatuses(inputs.planning);

  for (const packageId of packageIds) {
    const status = packageStatuses.get(packageId);
    if (!status?.match(/^done(?:\s|$)/u)) {
      blockers.push({
        kind: "package",
        id: packageId,
        detail: status ? `status is ${status}` : "missing from planning ledger",
      });
    }
  }

  if (checks.includes("parity-checklist")) {
    const result = inspectParityChecklist(inputs.checklist, inputs.deviations);
    const open = result.unresolved.filter(
      (item) => item.status === "open",
    ).length;
    const partial = result.unresolved.length - open;
    if (result.unresolved.length > 0) {
      blockers.push({
        kind: "checklist",
        id: "parity-checklist",
        detail: `${open} open and ${partial} partial items`,
      });
    }
    if (result.deviationsWithoutEvidence.length > 0) {
      blockers.push({
        kind: "checklist",
        id: "deviation-evidence",
        detail: `${result.deviationsWithoutEvidence.length} deviation items lack a valid deviations.md heading link`,
      });
    }
  }

  if (
    checks.includes("clean-worktree") &&
    inputs.worktreeStatus.trim() !== ""
  ) {
    blockers.push({
      kind: "repository",
      id: "clean-worktree",
      detail: "tracked or untracked changes are present",
    });
  }

  return {
    gate: layers.at(-1),
    layers: layers.map((gate) => gate.id),
    blockers,
    commands: layers.flatMap((gate) => gate.commands ?? []),
  };
}

function projectInputs(projectRoot) {
  let worktreeStatus;
  try {
    worktreeStatus = execFileSync("git", ["status", "--porcelain"], {
      cwd: projectRoot,
      encoding: "utf8",
    });
  } catch (error) {
    worktreeStatus = `git status failed: ${error.message}`;
  }
  return {
    planning: readText(resolve(projectRoot, "docs/planning.md")),
    checklist: readText(resolve(projectRoot, "docs/parity-checklist.md")),
    deviations: readText(resolve(projectRoot, "docs/deviations.md")),
    worktreeStatus,
  };
}

function commandParts(command) {
  const parts = command.match(/(?:[^\s"]+|"[^"]*")+/gu) ?? [];
  return parts.map((part) => part.replace(/^"|"$/gu, ""));
}

export function runCommands(commands, projectRoot, dryRun = false) {
  const results = [];
  for (const check of commands) {
    if (dryRun) {
      results.push({ ...check, status: "not-run" });
      continue;
    }
    process.stdout.write(`\n[${check.id}] ${check.command}\n`);
    const [executable, ...args] = commandParts(check.command);
    const windows = process.platform === "win32";
    const platformExecutable = windows
      ? (process.env.ComSpec ?? "cmd.exe")
      : executable;
    const platformArgs = windows ? ["/d", "/s", "/c", check.command] : args;
    const result = spawnSync(platformExecutable, platformArgs, {
      cwd: projectRoot,
      env: process.env,
      stdio: "inherit",
    });
    if (result.error) {
      process.stderr.write(`[${check.id}] ${result.error.message}\n`);
    }
    const status = result.status === 0 ? "passed" : "failed";
    results.push({ ...check, status, exitCode: result.status ?? 1 });
    if (status === "failed") break;
  }
  return results;
}

function report(result, commandResults = [], json = false) {
  const commandFailure = commandResults.some(
    (item) => item.status === "failed",
  );
  const passed = result.blockers.length === 0 && !commandFailure;
  const output = {
    gate: result.gate.id,
    label: result.gate.label,
    status: passed ? "PASS" : "BLOCKED",
    inherits: result.layers.slice(0, -1),
    blockers: result.blockers,
    commands: commandResults.length > 0 ? commandResults : result.commands,
  };
  if (json) {
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    return passed;
  }

  process.stdout.write(`${output.label}: ${output.status}\n`);
  if (output.inherits.length > 0) {
    process.stdout.write(`Inherits: ${output.inherits.join(" -> ")}\n`);
  }
  for (const blocker of output.blockers) {
    process.stdout.write(`- ${blocker.id}: ${blocker.detail}\n`);
  }
  for (const command of output.commands) {
    const suffix = command.status ? ` [${command.status}]` : "";
    process.stdout.write(`- ${command.id}: ${command.command}${suffix}\n`);
  }
  return passed;
}

function argumentValue(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

export function main(
  args = process.argv.slice(2),
  projectRoot = defaultProjectRoot,
) {
  const config = loadGateConfig(projectRoot);
  const json = args.includes("--json");
  const inputs = projectInputs(projectRoot);
  if (args.includes("--list")) {
    const summaries = config.gates.map((gate) =>
      inspectStaticGate(config, gate.id, inputs),
    );
    if (json) {
      process.stdout.write(
        `${JSON.stringify(
          summaries.map((summary) => ({
            gate: summary.gate.id,
            label: summary.gate.label,
            status: summary.blockers.length === 0 ? "READY" : "BLOCKED",
            blockers: summary.blockers,
          })),
          null,
          2,
        )}\n`,
      );
    } else {
      for (const summary of summaries) {
        process.stdout.write(
          `${summary.gate.label}: ${summary.blockers.length === 0 ? "READY" : `BLOCKED (${summary.blockers.length})`}\n`,
        );
      }
    }
    return 0;
  }

  const gateId = argumentValue(args, "--gate");
  if (!gateId) {
    throw new Error(
      "Usage: node scripts/release-gates.mjs --list | --gate <parity-complete|production-beta|release-candidate> [--dry-run] [--json]",
    );
  }
  const result = inspectStaticGate(config, gateId, inputs);
  if (result.blockers.length > 0) return report(result, [], json) ? 0 : 1;
  const commandResults = runCommands(
    result.commands,
    projectRoot,
    args.includes("--dry-run"),
  );
  return report(result, commandResults, json) ? 0 : 1;
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
