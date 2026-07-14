import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseEventSources } from "../../../scripts/parity-graph.mjs";

interface Requirement {
  id: string;
  kind: string;
  target?: string;
  effect?: string;
  expression?: string;
}

interface ParityGraphArtifact {
  files: string[];
  summary: Record<string, number>;
  requirements: Requirement[];
  edges: Array<{ from: string; to: string; relation: string }>;
  diagnostics: {
    duplicateRequirementIds: string[];
    unresolvedTransitions: unknown[];
  };
}

const parityGraph = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "src/generated/parity-graph.json"),
    "utf8",
  ),
) as ParityGraphArtifact;

const fixture = `
Events.Fixture = {
  sample: {
    title: _('Sample Event'),
    isAvailable: function() { return true; },
    scenes: {
      start: {
        combat: true,
        damage: 2,
        loot: { fur: { min: 1, max: 2, chance: 1 } },
        buttons: {
          go: {
            cost: { torch: 1 },
            reward: { scales: 1 },
            onChoose: function() { $SM.set('game.fixture', 1); },
            nextScene: { 1: 'finish' }
          }
        }
      },
      finish: { buttons: { leave: { nextScene: 'end' } } },
      alternate: { buttons: { leave: { nextScene: 'end' } } }
    }
  }
};
`;

function parseFixture(source: string) {
  return parseEventSources([
    { file: "ORIGINAL/script/events/fixture.js", source },
  ]);
}

describe("parser-backed parity graph", () => {
  it("locks the complete source graph denominator and unique requirement IDs", () => {
    expect(parityGraph.files).toEqual([
      "ORIGINAL/script/events/encounters.js",
      "ORIGINAL/script/events/executioner.js",
      "ORIGINAL/script/events/global.js",
      "ORIGINAL/script/events/marketing.js",
      "ORIGINAL/script/events/outside.js",
      "ORIGINAL/script/events/room.js",
      "ORIGINAL/script/events/setpieces.js",
    ]);
    expect(parityGraph.summary).toEqual({
      events: 48,
      scenes: 274,
      buttons: 462,
      transitions: 542,
      effects: 869,
      rewards: 352,
      requirements: 2547,
      edges: 2791,
    });
    expect(parityGraph.diagnostics).toEqual({
      duplicateRequirementIds: [],
      unresolvedTransitions: [],
    });

    const ids = parityGraph.requirements.map((requirement) => requirement.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^ADR-[A-Z0-9-]+$/.test(id))).toBe(true);
  });

  it("connects containment and transition edges only to known requirements", () => {
    const ids = new Set(
      parityGraph.requirements.map((requirement) => requirement.id),
    );
    for (const edge of parityGraph.edges) {
      expect(ids.has(edge.from), `unknown edge source ${edge.from}`).toBe(true);
      expect(ids.has(edge.to), `unknown edge target ${edge.to}`).toBe(true);
      expect(["contains", "transitions-to"]).toContain(edge.relation);
    }
  });

  it("keeps IDs stable while transition, effect, and reward mutations change the graph", () => {
    const baseline = parseFixture(fixture);
    const mutated = parseFixture(
      fixture
        .replace("{ 1: 'finish' }", "{ 1: 'alternate' }")
        .replace("scales: 1", "scales: 7")
        .replace("$SM.set('game.fixture', 1)", "$SM.set('game.fixture', 9)"),
    );

    expect(mutated.requirements.map(({ id }) => id)).toEqual(
      baseline.requirements.map(({ id }) => id),
    );
    expect(mutated.diagnostics.unresolvedTransitions).toEqual([]);

    const baselineTransition = baseline.requirements.find(
      (requirement) =>
        requirement.kind === "transition" && requirement.target === "finish",
    );
    const mutatedTransition = mutated.requirements.find(
      (requirement) => requirement.id === baselineTransition?.id,
    );
    expect(mutatedTransition?.target).toBe("alternate");

    const baselineReward = baseline.requirements.find(
      (requirement) =>
        requirement.kind === "reward" && requirement.expression === "1",
    );
    const mutatedReward = mutated.requirements.find(
      (requirement) => requirement.id === baselineReward?.id,
    );
    expect(mutatedReward?.expression).toBe("7");

    const baselineEffect = baseline.requirements.find(
      (requirement) =>
        requirement.kind === "effect" && requirement.effect === "onChoose",
    );
    const mutatedEffect = mutated.requirements.find(
      (requirement) => requirement.id === baselineEffect?.id,
    );
    expect(mutatedEffect?.expression).not.toBe(baselineEffect?.expression);
    expect(mutatedEffect?.expression).toContain("game.fixture', 9");
  });

  it("reports a mutated transition that no longer resolves", () => {
    const graph = parseFixture(
      fixture.replace("{ 1: 'finish' }", "{ 1: 'missing-scene' }"),
    );
    expect(graph.diagnostics.unresolvedTransitions).toEqual([
      expect.objectContaining({ targetKind: "scene", target: "missing-scene" }),
    ]);
  });
});
