export interface CanonicalSourceFile {
  path: string;
  bytes: number;
  lines: number;
  sha256: string;
}

export interface CanonicalEventTitle {
  file: string;
  title: string;
}

export interface CanonicalManifest {
  generatedAt: string;
  source: {
    repository: string;
    commit: string;
    localRoot: string;
  };
  files: CanonicalSourceFile[];
  keys: {
    roomDefinitions: string[];
    workers: string[];
    weapons: string[];
    fabricatorCraftables: string[];
    perks: string[];
    prestigeStores: string[];
    pathWeightOverrides: string[];
    audioConstants: string[];
    worldTileConstants: string[];
    worldLandmarkAssignments: string[];
  };
  events: {
    files: string[];
    titles: CanonicalEventTitle[];
  };
}
