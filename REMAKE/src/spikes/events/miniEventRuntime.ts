import type { Rng } from "../../engine";
import { StateStore } from "../../engine";

export interface MiniEventButton {
  cost?: Record<string, number>;
  reward?: Record<string, number>;
  nextScene: string | Record<number, string>;
}

export interface MiniEventScene {
  text: string[];
  buttons: Record<string, MiniEventButton>;
}

export interface MiniEventDefinition {
  startScene: string;
  scenes: Record<string, MiniEventScene>;
}

export interface MiniEventResult {
  scene: string;
  appliedCost: Record<string, number>;
  appliedReward: Record<string, number>;
}

export class MiniEventRuntime {
  private activeScene: string;

  constructor(
    private readonly definition: MiniEventDefinition,
    private readonly state: StateStore,
    private readonly rng: Rng,
  ) {
    this.activeScene = definition.startScene;
  }

  scene(): MiniEventScene {
    return this.definition.scenes[this.activeScene];
  }

  choose(buttonKey: string): MiniEventResult {
    const button = this.scene().buttons[buttonKey];
    if (!button) {
      throw new Error(`Unknown mini event button: ${buttonKey}`);
    }

    this.applyCost(button.cost ?? {});
    this.applyReward(button.reward ?? {});
    this.activeScene = this.resolveNextScene(button.nextScene);

    return {
      scene: this.activeScene,
      appliedCost: button.cost ?? {},
      appliedReward: button.reward ?? {},
    };
  }

  private applyCost(cost: Record<string, number>): void {
    for (const [store, amount] of Object.entries(cost)) {
      const current = this.state.get(`stores["${store}"]`, true);
      if (typeof current !== "number" || current < amount) {
        throw new Error(`Cannot afford mini event cost: ${store}`);
      }
      this.state.add(`stores["${store}"]`, -amount);
    }
  }

  private applyReward(reward: Record<string, number>): void {
    for (const [store, amount] of Object.entries(reward)) {
      this.state.add(`stores["${store}"]`, amount);
    }
  }

  private resolveNextScene(nextScene: string | Record<number, string>): string {
    if (typeof nextScene === "string") return nextScene;

    const roll = this.rng.next();
    const thresholds = Object.keys(nextScene)
      .map(Number)
      .sort((a, b) => a - b);

    for (const threshold of thresholds) {
      if (roll <= threshold) {
        return nextScene[threshold];
      }
    }

    return nextScene[thresholds[thresholds.length - 1]];
  }
}

export function createMiniEventFixture(): MiniEventDefinition {
  return {
    startScene: "start",
    scenes: {
      start: {
        text: ["a test scene waits in the dark."],
        buttons: {
          search: {
            cost: { wood: 1 },
            reward: { fur: 2 },
            nextScene: {
              0.5: "quiet",
              1: "noise",
            },
          },
        },
      },
      quiet: {
        text: ["nothing answers."],
        buttons: {},
      },
      noise: {
        text: ["something moves."],
        buttons: {},
      },
    },
  };
}
