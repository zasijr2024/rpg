export interface ProgressionResult {
  seed: number;
  completed: boolean;
  stage:
    | "opening"
    | "compass"
    | "first-expedition"
    | "deep-economy"
    | "executioner"
    | "ship"
    | "space"
    | "complete";
  elapsedMs: number;
  deaths: number;
  incidentalEvents: number;
  combats: number;
  bottleneck: string | null;
  failureClass: "policy" | "game-defect" | "unclassified" | null;
  checkpoints: string[];
  milestones: Partial<Record<ProgressionResult["stage"], number>>;
}

export interface ProgressionDistribution {
  min: number;
  median: number;
  p90: number;
  max: number;
}

export interface ProgressionSummary {
  seeds: number;
  completed: number;
  completionRate: number | null;
  deaths: number;
  incidentalEvents: number;
  combats: number;
  completionMs: ProgressionDistribution | null;
  milestones: Record<string, ProgressionDistribution | null>;
  failureClasses: Record<string, number>;
  stageFailures: Record<string, number>;
  bottlenecks: Array<{ detail: string; count: number }>;
  results: ProgressionResult[];
}

export function progressionSeed(index: number): number;
export function createProgressionShard(
  seedStart: number,
  results: ProgressionResult[],
): unknown;
export function writeProgressionShard(
  path: string,
  seedStart: number,
  results: ProgressionResult[],
): void;
export function validateProgressionShard(
  value: unknown,
  source?: string,
): unknown;
export function summarizeProgressionResults(
  results: ProgressionResult[],
): ProgressionSummary;
export function aggregateProgressionShards(
  shards: unknown[],
  metadata: {
    seedStart: number;
    seedCount: number;
    revision: string;
    worktree: "clean" | "dirty";
    environment: {
      node: string;
      npm: string;
      platform: string;
      arch: string;
    };
    command: string;
  },
): unknown;
