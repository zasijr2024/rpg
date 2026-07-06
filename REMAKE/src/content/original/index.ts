export {
  canonicalManifest,
  SOURCE_BASELINE_COMMIT
} from "./manifest/canonicalManifest";
export type {
  CanonicalEventTitle,
  CanonicalManifest,
  CanonicalSourceFile
} from "./manifest/types";
export { originalContentRegistry } from "./registry";
export { originalPerks } from "./core/perks";
export {
  originalPrestigeStores,
  type OriginalPrestigeStoreType
} from "./core/prestige";
export {
  DEFAULT_BAG_SPACE,
  DEFAULT_ITEM_WEIGHT,
  originalPathWeightFor,
  originalPathWeightOverrides
} from "./path/pathWeights";
