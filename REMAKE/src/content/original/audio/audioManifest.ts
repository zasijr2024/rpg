import { canonicalManifest } from "../manifest/canonicalManifest";

export type OriginalAudioKind =
  "music" | "event" | "landmark" | "encounter" | "effect" | "weapon" | "space";

export interface OriginalAudioDefinition {
  key: string;
  path: string;
  kind: OriginalAudioKind;
}

export const AUDIO_FADE_TIME = 1;
export const AUDIO_EVENT_DUCK_VOLUME = 0.2;
export const AUDIO_EVENT_FADE_MULTIPLIER = 2;
export const AUDIO_MISSING_BUFFER_CHANNELS = 1;
export const AUDIO_MISSING_BUFFER_SECONDS = 1;
export const AUDIO_MISSING_BUFFER_SINE_STEP = 0.05;
export const AUDIO_MISSING_BUFFER_GAIN_DIVISOR = 4;
export const AUDIO_SAFARI_DECODE_POLL_MS = 20;

export const originalAudioManifest: OriginalAudioDefinition[] = [
  { key: "MUSIC_DUSTY_PATH", path: "audio/dusty-path.flac", kind: "music" },
  {
    key: "MUSIC_SILENT_FOREST",
    path: "audio/silent-forest.flac",
    kind: "music",
  },
  { key: "MUSIC_LONELY_HUT", path: "audio/lonely-hut.flac", kind: "music" },
  { key: "MUSIC_TINY_VILLAGE", path: "audio/tiny-village.flac", kind: "music" },
  {
    key: "MUSIC_MODEST_VILLAGE",
    path: "audio/modest-village.flac",
    kind: "music",
  },
  {
    key: "MUSIC_LARGE_VILLAGE",
    path: "audio/large-village.flac",
    kind: "music",
  },
  {
    key: "MUSIC_RAUCOUS_VILLAGE",
    path: "audio/raucous-village.flac",
    kind: "music",
  },
  { key: "MUSIC_FIRE_DEAD", path: "audio/fire-dead.flac", kind: "music" },
  {
    key: "MUSIC_FIRE_SMOLDERING",
    path: "audio/fire-smoldering.flac",
    kind: "music",
  },
  {
    key: "MUSIC_FIRE_FLICKERING",
    path: "audio/fire-flickering.flac",
    kind: "music",
  },
  { key: "MUSIC_FIRE_BURNING", path: "audio/fire-burning.flac", kind: "music" },
  { key: "MUSIC_FIRE_ROARING", path: "audio/fire-roaring.flac", kind: "music" },
  { key: "MUSIC_WORLD", path: "audio/world.flac", kind: "music" },
  { key: "MUSIC_SPACE", path: "audio/space.flac", kind: "music" },
  { key: "MUSIC_ENDING", path: "audio/ending.flac", kind: "music" },
  { key: "MUSIC_SHIP", path: "audio/ship.flac", kind: "music" },
  { key: "EVENT_NOMAD", path: "audio/event-nomad.flac", kind: "event" },
  {
    key: "EVENT_NOISES_OUTSIDE",
    path: "audio/event-noises-outside.flac",
    kind: "event",
  },
  {
    key: "EVENT_NOISES_INSIDE",
    path: "audio/event-noises-inside.flac",
    kind: "event",
  },
  { key: "EVENT_BEGGAR", path: "audio/event-beggar.flac", kind: "event" },
  {
    key: "EVENT_SHADY_BUILDER",
    path: "audio/event-shady-builder.flac",
    kind: "event",
  },
  {
    key: "EVENT_MYSTERIOUS_WANDERER",
    path: "audio/event-mysterious-wanderer.flac",
    kind: "event",
  },
  { key: "EVENT_SCOUT", path: "audio/event-scout.flac", kind: "event" },
  {
    key: "EVENT_WANDERING_MASTER",
    path: "audio/event-wandering-master.flac",
    kind: "event",
  },
  { key: "EVENT_SICK_MAN", path: "audio/event-sick-man.flac", kind: "event" },
  {
    key: "EVENT_RUINED_TRAP",
    path: "audio/event-ruined-trap.flac",
    kind: "event",
  },
  { key: "EVENT_HUT_FIRE", path: "audio/event-hut-fire.flac", kind: "event" },
  { key: "EVENT_SICKNESS", path: "audio/event-sickness.flac", kind: "event" },
  { key: "EVENT_PLAGUE", path: "audio/event-plague.flac", kind: "event" },
  {
    key: "EVENT_BEAST_ATTACK",
    path: "audio/event-beast-attack.flac",
    kind: "event",
  },
  {
    key: "EVENT_SOLDIER_ATTACK",
    path: "audio/event-soldier-attack.flac",
    kind: "event",
  },
  { key: "EVENT_THIEF", path: "audio/event-thief.flac", kind: "event" },
  {
    key: "LANDMARK_FRIENDLY_OUTPOST",
    path: "audio/landmark-friendly-outpost.flac",
    kind: "landmark",
  },
  {
    key: "LANDMARK_SWAMP",
    path: "audio/landmark-swamp.flac",
    kind: "landmark",
  },
  { key: "LANDMARK_CAVE", path: "audio/landmark-cave.flac", kind: "landmark" },
  { key: "LANDMARK_TOWN", path: "audio/landmark-town.flac", kind: "landmark" },
  { key: "LANDMARK_CITY", path: "audio/landmark-city.flac", kind: "landmark" },
  {
    key: "LANDMARK_HOUSE",
    path: "audio/landmark-house.flac",
    kind: "landmark",
  },
  {
    key: "LANDMARK_BATTLEFIELD",
    path: "audio/landmark-battlefield.flac",
    kind: "landmark",
  },
  {
    key: "LANDMARK_BOREHOLE",
    path: "audio/landmark-borehole.flac",
    kind: "landmark",
  },
  {
    key: "LANDMARK_CRASHED_SHIP",
    path: "audio/landmark-crashed-ship.flac",
    kind: "landmark",
  },
  {
    key: "LANDMARK_SULPHUR_MINE",
    path: "audio/landmark-sulphurmine.flac",
    kind: "landmark",
  },
  {
    key: "LANDMARK_COAL_MINE",
    path: "audio/landmark-coalmine.flac",
    kind: "landmark",
  },
  {
    key: "LANDMARK_IRON_MINE",
    path: "audio/landmark-ironmine.flac",
    kind: "landmark",
  },
  {
    key: "LANDMARK_DESTROYED_VILLAGE",
    path: "audio/landmark-destroyed-village.flac",
    kind: "landmark",
  },
  {
    key: "ENCOUNTER_TIER_1",
    path: "audio/encounter-tier-1.flac",
    kind: "encounter",
  },
  {
    key: "ENCOUNTER_TIER_2",
    path: "audio/encounter-tier-2.flac",
    kind: "encounter",
  },
  {
    key: "ENCOUNTER_TIER_3",
    path: "audio/encounter-tier-3.flac",
    kind: "encounter",
  },
  { key: "LIGHT_FIRE", path: "audio/light-fire.flac", kind: "effect" },
  { key: "STOKE_FIRE", path: "audio/stoke-fire.flac", kind: "effect" },
  { key: "BUILD", path: "audio/build.flac", kind: "effect" },
  { key: "CRAFT", path: "audio/craft.flac", kind: "effect" },
  { key: "BUY", path: "audio/buy.flac", kind: "effect" },
  { key: "GATHER_WOOD", path: "audio/gather-wood.flac", kind: "effect" },
  { key: "CHECK_TRAPS", path: "audio/check-traps.flac", kind: "effect" },
  { key: "EMBARK", path: "audio/embark.flac", kind: "effect" },
  { key: "FOOTSTEPS_1", path: "audio/footsteps-1.flac", kind: "effect" },
  { key: "FOOTSTEPS_2", path: "audio/footsteps-2.flac", kind: "effect" },
  { key: "FOOTSTEPS_3", path: "audio/footsteps-3.flac", kind: "effect" },
  { key: "FOOTSTEPS_4", path: "audio/footsteps-4.flac", kind: "effect" },
  { key: "FOOTSTEPS_5", path: "audio/footsteps-5.flac", kind: "effect" },
  { key: "FOOTSTEPS_6", path: "audio/footsteps-6.flac", kind: "effect" },
  { key: "EAT_MEAT", path: "audio/eat-meat.flac", kind: "effect" },
  { key: "USE_MEDS", path: "audio/use-meds.flac", kind: "effect" },
  {
    key: "WEAPON_UNARMED_1",
    path: "audio/weapon-unarmed-1.flac",
    kind: "weapon",
  },
  {
    key: "WEAPON_UNARMED_2",
    path: "audio/weapon-unarmed-2.flac",
    kind: "weapon",
  },
  {
    key: "WEAPON_UNARMED_3",
    path: "audio/weapon-unarmed-3.flac",
    kind: "weapon",
  },
  { key: "WEAPON_MELEE_1", path: "audio/weapon-melee-1.flac", kind: "weapon" },
  { key: "WEAPON_MELEE_2", path: "audio/weapon-melee-2.flac", kind: "weapon" },
  { key: "WEAPON_MELEE_3", path: "audio/weapon-melee-3.flac", kind: "weapon" },
  {
    key: "WEAPON_RANGED_1",
    path: "audio/weapon-ranged-1.flac",
    kind: "weapon",
  },
  {
    key: "WEAPON_RANGED_2",
    path: "audio/weapon-ranged-2.flac",
    kind: "weapon",
  },
  {
    key: "WEAPON_RANGED_3",
    path: "audio/weapon-ranged-3.flac",
    kind: "weapon",
  },
  { key: "DEATH", path: "audio/death.flac", kind: "effect" },
  { key: "REINFORCE_HULL", path: "audio/reinforce-hull.flac", kind: "effect" },
  { key: "UPGRADE_ENGINE", path: "audio/upgrade-engine.flac", kind: "effect" },
  { key: "LIFT_OFF", path: "audio/lift-off.flac", kind: "effect" },
  { key: "ASTEROID_HIT_1", path: "audio/asteroid-hit-1.flac", kind: "space" },
  { key: "ASTEROID_HIT_2", path: "audio/asteroid-hit-2.flac", kind: "space" },
  { key: "ASTEROID_HIT_3", path: "audio/asteroid-hit-3.flac", kind: "space" },
  { key: "ASTEROID_HIT_4", path: "audio/asteroid-hit-4.flac", kind: "space" },
  { key: "ASTEROID_HIT_5", path: "audio/asteroid-hit-5.flac", kind: "space" },
  { key: "ASTEROID_HIT_6", path: "audio/asteroid-hit-6.flac", kind: "space" },
  { key: "ASTEROID_HIT_7", path: "audio/asteroid-hit-7.flac", kind: "space" },
  { key: "ASTEROID_HIT_8", path: "audio/asteroid-hit-8.flac", kind: "space" },
  { key: "CRASH", path: "audio/crash.flac", kind: "space" },
];

assertKeysMatchManifest();

function assertKeysMatchManifest(): void {
  const keys = originalAudioManifest.map((audio) => audio.key);
  if (
    keys.join("\u0000") !== canonicalManifest.keys.audioConstants.join("\u0000")
  ) {
    throw new Error("Original audio constants do not match canonical manifest");
  }
}
