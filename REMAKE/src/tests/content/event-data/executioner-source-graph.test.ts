import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

interface ExecutionerRequirement {
  kind: string;
  key?: string;
  title?: string;
  source?: { file?: string };
}

interface ParityGraphArtifact {
  requirements: ExecutionerRequirement[];
}

const parityGraph = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "src/generated/parity-graph.json"),
    "utf8",
  ),
) as ParityGraphArtifact;

const executionerRequirements = parityGraph.requirements.filter(
  (requirement) =>
    requirement.source?.file === "ORIGINAL/script/events/executioner.js",
);

describe("Executioner source graph denominator", () => {
  it("locks every original Executioner event, scene, control, effect, and reward", () => {
    expect(
      Object.fromEntries(
        ["event", "scene", "button", "transition", "effect", "reward"].map(
          (kind) => [
            kind,
            executionerRequirements.filter(
              (requirement) => requirement.kind === kind,
            ).length,
          ],
        ),
      ),
    ).toEqual({
      event: 6,
      scene: 103,
      button: 203,
      transition: 226,
      effect: 196,
      reward: 64,
    });
    expect(executionerRequirements).toHaveLength(798);

    expect(
      executionerRequirements
        .filter((requirement) => requirement.kind === "event")
        .map(({ key, title }) => ({ key, title })),
    ).toEqual([
      { key: "executioner-intro", title: "A Ravaged Battleship" },
      { key: "executioner-antechamber", title: "A Ravaged Battleship" },
      { key: "executioner-engineering", title: "Engineering Wing" },
      { key: "executioner-martial", title: "Martial Wing" },
      { key: "executioner-medical", title: "Medical Wing" },
      { key: "executioner-command", title: "Command Deck" },
    ]);
  });
});
