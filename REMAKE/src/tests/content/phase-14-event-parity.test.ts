import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  originalEventDefinitions,
  originalExecutionerCombatDefinitions,
  originalSetpieceCombatDefinitions,
} from "../../content/original";

interface SourceLocation {
  file: string;
}

interface ParityRequirement {
  id: string;
  kind: "event" | "scene" | "button" | "transition" | "effect" | "reward";
  eventId?: string;
  key?: string;
  title?: string;
  source: SourceLocation;
}

interface ParityGraph {
  summary: Record<string, number>;
  requirements: ParityRequirement[];
}

const parityGraph = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "src/generated/parity-graph.json"),
    "utf8",
  ),
) as ParityGraph;

const numberedRuntimeKeys: Record<string, string[]> = {
  "ORIGINAL/script/events/encounters.js": [
    "encounter.snarling-beast",
    "encounter.gaunt-man",
    "encounter.strange-bird",
    "encounter.two-headed-creature",
    "encounter.shivering-man",
    "encounter.man-eater",
    "encounter.scavenger",
    "encounter.huge-lizard",
    "encounter.feral-terror",
    "encounter.soldier",
    "encounter.sniper",
  ],
  "ORIGINAL/script/events/global.js": ["global.thief"],
  "ORIGINAL/script/events/marketing.js": ["marketing.penrose"],
  "ORIGINAL/script/events/outside.js": [
    "outside.ruined-trap",
    "outside.hut-fire",
    "outside.sickness",
    "outside.plague",
    "outside.beast-attack",
    "outside.military-raid",
  ],
  "ORIGINAL/script/events/room.js": [
    "room.nomad",
    "room.noises-outside",
    "room.noises-inside",
    "room.beggar",
    "room.shady-builder",
    "room.mysterious-wanderer.wood",
    "room.mysterious-wanderer.fur",
    "room.scout",
    "room.master",
    "room.sick-man",
  ],
};

const sourcePoolByFile: Record<
  string,
  (typeof originalEventDefinitions)[number]["pool"]
> = {
  "ORIGINAL/script/events/encounters.js": "encounter",
  "ORIGINAL/script/events/executioner.js": "executioner",
  "ORIGINAL/script/events/global.js": "global",
  "ORIGINAL/script/events/marketing.js": "marketing",
  "ORIGINAL/script/events/outside.js": "outside",
  "ORIGINAL/script/events/room.js": "room",
  "ORIGINAL/script/events/setpieces.js": "setpiece",
};

describe("Phase 14 parser-backed event parity", () => {
  it("maps all 48 source event identities and titles onto executable runtime catalogs", () => {
    const sourceEvents = parityGraph.requirements.filter(
      (requirement) => requirement.kind === "event",
    );
    const coveredRuntimeKeys = new Set<string>();

    expect(sourceEvents).toHaveLength(48);
    sourceEvents.forEach((sourceEvent) => {
      const runtimeEvents = runtimeEventsForSource(sourceEvent);
      expect(
        runtimeEvents.length,
        `${sourceEvent.id} has no runtime event evidence`,
      ).toBeGreaterThan(0);
      runtimeEvents.forEach((runtimeEvent) => {
        expect(runtimeEvent.title).toBe(sourceEvent.title);
        expect(coveredRuntimeKeys.has(runtimeEvent.key)).toBe(false);
        coveredRuntimeKeys.add(runtimeEvent.key);
      });
    });

    expect(coveredRuntimeKeys).toEqual(
      new Set(originalEventDefinitions.map((event) => event.key)),
    );
  });

  it("preserves every canonical scene identity outside routed Executioner variants", () => {
    const sourceEvents = parityGraph.requirements.filter(
      (requirement) =>
        requirement.kind === "event" &&
        requirement.source.file !== "ORIGINAL/script/events/executioner.js",
    );
    let coveredScenes = 0;

    sourceEvents.forEach((sourceEvent) => {
      const runtimeEvent = canonicalRuntimeEventForSource(sourceEvent);
      const sourceSceneKeys = parityGraph.requirements
        .filter(
          (requirement) =>
            requirement.kind === "scene" &&
            requirement.eventId === sourceEvent.id,
        )
        .map((requirement) => requirement.key);
      expect(Object.keys(runtimeEvent.scenes)).toEqual(sourceSceneKeys);
      coveredScenes += sourceSceneKeys.length;
    });

    expect(coveredScenes).toBe(171);
    expect(
      parityGraph.requirements.filter(
        (requirement) =>
          requirement.kind === "scene" &&
          requirement.source.file === "ORIGINAL/script/events/executioner.js",
      ),
    ).toHaveLength(103);
    expect(parityGraph.summary.scenes).toBe(274);
  });

  it("preserves every translated source string across data, controls, effects, and combat", () => {
    const missingByFile: Record<string, string[]> = {};

    Object.entries(sourcePoolByFile).forEach(([file, pool]) => {
      const sourceStrings = translatedStrings(
        readFileSync(resolve(process.cwd(), "..", file), "utf8"),
        file,
      );
      const runtimeStrings = new Set<string>();
      collectRuntimeStrings(
        originalEventDefinitions.filter((event) => event.pool === pool),
        runtimeStrings,
      );
      if (pool === "setpiece") {
        collectRuntimeStrings(
          originalSetpieceCombatDefinitions,
          runtimeStrings,
        );
      }
      if (pool === "executioner") {
        collectRuntimeStrings(
          originalExecutionerCombatDefinitions,
          runtimeStrings,
        );
      }
      missingByFile[file] = [...sourceStrings].filter(
        (value) => !runtimeStrings.has(value),
      );
    });

    expect(missingByFile).toEqual(
      Object.fromEntries(
        Object.keys(sourcePoolByFile).map((file) => [file, []]),
      ),
    );
  });

  it("locks the complete Phase 14 source denominator", () => {
    expect(parityGraph.summary).toMatchObject({
      events: 48,
      scenes: 274,
      buttons: 462,
      transitions: 542,
      effects: 869,
      rewards: 352,
      requirements: 2547,
      edges: 2791,
    });
  });
});

function runtimeEventsForSource(sourceEvent: ParityRequirement) {
  const file = sourceEvent.source.file;
  const numberedKeys = numberedRuntimeKeys[file];
  if (numberedKeys) {
    const sourceEvents = parityGraph.requirements.filter(
      (requirement) =>
        requirement.kind === "event" && requirement.source.file === file,
    );
    const sourceIndex = sourceEvents.findIndex(
      (requirement) => requirement.id === sourceEvent.id,
    );
    return originalEventDefinitions.filter(
      (event) => event.key === numberedKeys[sourceIndex],
    );
  }

  if (file === "ORIGINAL/script/events/setpieces.js") {
    return originalEventDefinitions.filter(
      (event) => event.pool === "setpiece" && event.title === sourceEvent.title,
    );
  }

  if (file === "ORIGINAL/script/events/executioner.js") {
    return originalEventDefinitions.filter((event) => {
      if (event.pool !== "executioner") return false;
      switch (sourceEvent.key) {
        case "executioner-intro":
          return event.key.startsWith("executioner.intro-");
        case "executioner-antechamber":
          return event.key === "executioner.antechamber";
        case "executioner-engineering":
          return event.key.startsWith("executioner.engineering-");
        case "executioner-martial":
          return event.key.startsWith("executioner.martial-");
        case "executioner-medical":
          return (
            event.key.startsWith("executioner.medical-") ||
            event.key === "executioner.unstable-automaton"
          );
        case "executioner-command":
          return event.key.startsWith("executioner.command-");
        default:
          return false;
      }
    });
  }

  return [];
}

function canonicalRuntimeEventForSource(sourceEvent: ParityRequirement) {
  if (sourceEvent.source.file === "ORIGINAL/script/events/setpieces.js") {
    const runtimeEvent = originalEventDefinitions.find(
      (event) => event.key === `setpiece.${sourceEvent.key}`,
    );
    expect(runtimeEvent).toBeDefined();
    return runtimeEvent!;
  }
  const runtimeEvents = runtimeEventsForSource(sourceEvent);
  expect(runtimeEvents).toHaveLength(1);
  return runtimeEvents[0];
}

function translatedStrings(source: string, file: string): Set<string> {
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const strings = new Set<string>();
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "_" &&
      node.arguments[0] &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      strings.add(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return strings;
}

function collectRuntimeStrings(value: unknown, strings: Set<string>): void {
  if (typeof value === "string") {
    strings.add(value);
    return;
  }
  if (typeof value === "function") {
    const sourceFile = ts.createSourceFile(
      "runtime-function.ts",
      value.toString(),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    const visit = (node: ts.Node) => {
      if (ts.isStringLiteralLike(node)) strings.add(node.text);
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectRuntimeStrings(entry, strings));
    return;
  }
  if (!value || typeof value !== "object") return;
  Object.entries(value).forEach(([key, entry]) => {
    strings.add(key);
    collectRuntimeStrings(entry, strings);
  });
}
