export interface EventSource {
  file: string;
  source: string;
}

export interface ParityRequirement {
  id: string;
  kind: "event" | "scene" | "button" | "transition" | "effect" | "reward";
  [key: string]: unknown;
}

export interface ParityGraph {
  schemaVersion: number;
  files: string[];
  summary: Record<string, number>;
  requirements: ParityRequirement[];
  edges: Array<{
    from: string;
    to: string;
    relation: "contains" | "transitions-to";
  }>;
  diagnostics: {
    duplicateRequirementIds: string[];
    unresolvedTransitions: Array<Record<string, string>>;
  };
}

export function parseEventSources(sourceFiles: EventSource[]): ParityGraph;
export function buildArtifacts(workspaceRoot: string): {
  canonicalManifest: Record<string, unknown>;
  parityGraph: ParityGraph;
};
