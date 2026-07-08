import { canonicalManifest } from "../manifest/canonicalManifest";

export interface OriginalPerkDefinition {
  key: string;
  name: string;
  desc: string;
  notify: string;
}

export const originalPerks: OriginalPerkDefinition[] = [
  {
    key: "boxer",
    name: "boxer",
    desc: "punches do more damage",
    notify: "learned to throw punches with purpose",
  },
  {
    key: "martial artist",
    name: "martial artist",
    desc: "punches do even more damage.",
    notify: "learned to fight quite effectively without weapons",
  },
  {
    key: "unarmed master",
    name: "unarmed master",
    desc: "punch twice as fast, and with even more force",
    notify: "learned to strike faster without weapons",
  },
  {
    key: "barbarian",
    name: "barbarian",
    desc: "melee weapons deal more damage",
    notify: "learned to swing weapons with force",
  },
  {
    key: "slow metabolism",
    name: "slow metabolism",
    desc: "go twice as far without eating",
    notify: "learned how to ignore the hunger",
  },
  {
    key: "desert rat",
    name: "desert rat",
    desc: "go twice as far without drinking",
    notify: "learned to love the dry air",
  },
  {
    key: "evasive",
    name: "evasive",
    desc: "dodge attacks more effectively",
    notify: "learned to be where they're not",
  },
  {
    key: "precise",
    name: "precise",
    desc: "land blows more often",
    notify: "learned to predict their movement",
  },
  {
    key: "scout",
    name: "scout",
    desc: "see farther",
    notify: "learned to look ahead",
  },
  {
    key: "stealthy",
    name: "stealthy",
    desc: "better avoid conflict in the wild",
    notify: "learned how not to be seen",
  },
  {
    key: "gastronome",
    name: "gastronome",
    desc: "restore more health when eating",
    notify: "learned to make the most of food",
  },
];

assertKeysMatchManifest();

function assertKeysMatchManifest(): void {
  const keys = originalPerks.map((perk) => perk.key);
  if (keys.join("\u0000") !== canonicalManifest.keys.perks.join("\u0000")) {
    throw new Error("Original perk keys do not match canonical manifest");
  }
}
