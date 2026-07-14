import { describe, expect, it } from "vitest";
import {
  aggregateProgressionShards,
  createProgressionShard,
  progressionSeed,
  validateProgressionShard,
  type ProgressionResult,
} from "../../../scripts/progression-corpus.mjs";

const revision = "0123456789abcdef0123456789abcdef01234567";
const metadata = {
  seedStart: 0,
  seedCount: 4,
  revision,
  worktree: "clean" as const,
  environment: {
    node: "v25.4.0",
    npm: "11.7.0",
    platform: "win32",
    arch: "x64",
  },
  command:
    "node scripts/progression-corpus.mjs --seeds=4 --start=0 --shard-size=2 --jobs=2",
};

function completedResult(index: number, elapsedMs: number): ProgressionResult {
  return {
    seed: progressionSeed(index),
    completed: true,
    stage: "complete",
    elapsedMs,
    deaths: index,
    incidentalEvents: 100 + index,
    combats: 20 + index,
    bottleneck: null,
    failureClass: null,
    checkpoints: [`${elapsedMs}:milestone:complete`],
    milestones: {
      compass: 10,
      "first-expedition": 20,
      "deep-economy": 30,
      executioner: 40,
      ship: 50,
      space: 60,
      complete: elapsedMs,
    },
  };
}

function failedResult(index: number): ProgressionResult {
  return {
    seed: progressionSeed(index),
    completed: false,
    stage: "executioner",
    elapsedMs: 75,
    deaths: 2,
    incidentalEvents: 150,
    combats: 30,
    bottleneck: "executioner exhausted four legal attempts",
    failureClass: "policy",
    checkpoints: ["75:executioner:death:attempt-4"],
    milestones: {
      compass: 10,
      "first-expedition": 20,
      "deep-economy": 30,
    },
  };
}

describe("progression corpus evidence", () => {
  it("aggregates out-of-order shards into one fixed, seed-ordered corpus", () => {
    const first = createProgressionShard(0, [
      completedResult(0, 100),
      completedResult(1, 200),
    ]);
    const second = createProgressionShard(2, [
      failedResult(2),
      completedResult(3, 400),
    ]);
    const artifact = aggregateProgressionShards([second, first], metadata) as {
      revision: string;
      worktree: string;
      summary: {
        seeds: number;
        completed: number;
        completionRate: number;
        deaths: number;
        completionMs: { min: number; median: number; p90: number; max: number };
        failureClasses: Record<string, number>;
        stageFailures: Record<string, number>;
        bottlenecks: Array<{ detail: string; count: number }>;
        results: ProgressionResult[];
      };
    };

    expect(artifact).toMatchObject({ revision, worktree: "clean" });
    expect(artifact.summary).toMatchObject({
      seeds: 4,
      completed: 3,
      completionRate: 0.75,
      deaths: 6,
      completionMs: { min: 100, median: 200, p90: 400, max: 400 },
      failureClasses: {
        policy: 1,
        "game-defect": 0,
        unclassified: 0,
      },
      stageFailures: { executioner: 1 },
      bottlenecks: [
        { detail: "executioner exhausted four legal attempts", count: 1 },
      ],
    });
    expect(artifact.summary.results.map((result) => result.seed)).toEqual(
      [0, 1, 2, 3].map(progressionSeed),
    );
  });

  it("fails closed for duplicate, missing, extra, or mutated seeds", () => {
    const first = createProgressionShard(0, [
      completedResult(0, 100),
      completedResult(1, 200),
    ]);
    const second = createProgressionShard(2, [
      completedResult(2, 300),
      completedResult(3, 400),
    ]);

    expect(() =>
      aggregateProgressionShards([first, first, second], metadata),
    ).toThrow("duplicate seed");
    expect(() => aggregateProgressionShards([first], metadata)).toThrow(
      "missing seed",
    );
    expect(() =>
      aggregateProgressionShards(
        [first, second, createProgressionShard(4, [completedResult(4, 500)])],
        metadata,
      ),
    ).toThrow("outside the requested range");

    const mutated = structuredClone(first) as {
      results: Array<{ seed: number }>;
    };
    mutated.results[0]!.seed = 123;
    expect(() => validateProgressionShard(mutated)).toThrow(
      "fixed corpus index",
    );
  });

  it("rejects unclassified failures and inconsistent completions", () => {
    const unclassified = {
      ...failedResult(0),
      failureClass: null,
    };
    expect(() => createProgressionShard(0, [unclassified])).toThrow(
      "must be classified",
    );

    const inconsistent = {
      ...completedResult(0, 100),
      bottleneck: "unexpected stop",
    };
    expect(() => createProgressionShard(0, [inconsistent])).toThrow(
      "failure state",
    );
  });
});
