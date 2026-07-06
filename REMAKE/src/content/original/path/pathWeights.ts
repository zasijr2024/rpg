import { canonicalManifest } from "../manifest/canonicalManifest";

export interface OriginalPathWeightOverride {
  key: string;
  source: "canonical-manifest";
}

export const originalPathWeightOverrides: OriginalPathWeightOverride[] =
  canonicalManifest.keys.pathWeightOverrides.map((key) => ({
    key,
    source: "canonical-manifest"
  }));

