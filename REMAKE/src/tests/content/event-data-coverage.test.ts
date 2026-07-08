import { describe, expect, it } from "vitest";
import {
  canonicalManifest,
  originalExecutionerCombatDefinitions,
  originalEventDefinitions,
  originalSetpieceCombatDefinitions,
} from "../../content/original";

describe("event data coverage", () => {
  it("tracks current event coverage against the canonical manifest", () => {
    const canonicalTitles = canonicalManifest.events.titles.map(
      (entry) => entry.title,
    );
    const portedTitles = new Set(
      originalEventDefinitions.map((entry) => entry.title),
    );

    expect(canonicalManifest.events.titles).toHaveLength(45);
    expect(originalEventDefinitions).toHaveLength(116);
    expect(portedTitles.size).toBeGreaterThanOrEqual(12);
    expect(canonicalTitles).toEqual(expect.arrayContaining([...portedTitles]));
  });

  it("covers every original Phase 5 non-combat event pool definition", () => {
    const phase5Events = originalEventDefinitions.filter((entry) =>
      ["global", "room", "outside", "marketing"].includes(entry.pool),
    );
    const phase5Titles = new Set(phase5Events.map((entry) => entry.title));
    const phase5CanonicalTitles = canonicalManifest.events.titles
      .filter((entry) =>
        [
          "ORIGINAL/script/events/global.js",
          "ORIGINAL/script/events/room.js",
          "ORIGINAL/script/events/outside.js",
          "ORIGINAL/script/events/marketing.js",
        ].includes(entry.file),
      )
      .map((entry) => entry.title);

    expect(phase5Events).toHaveLength(18);
    expect(
      phase5Events.filter((entry) => entry.pool === "global"),
    ).toHaveLength(1);
    expect(phase5Events.filter((entry) => entry.pool === "room")).toHaveLength(
      10,
    );
    expect(
      phase5Events.filter((entry) => entry.pool === "outside"),
    ).toHaveLength(6);
    expect(
      phase5Events.filter((entry) => entry.pool === "marketing"),
    ).toHaveLength(1);
    expect([...phase5Titles]).toEqual(
      expect.arrayContaining(phase5CanonicalTitles),
    );
  });

  it("covers every original Phase 6 wilderness encounter definition", () => {
    const encounters = originalEventDefinitions.filter(
      (entry) => entry.pool === "encounter",
    );
    const encounterTitles = encounters.map((entry) => entry.title);
    const canonicalEncounterTitles = canonicalManifest.events.titles
      .filter((entry) => entry.file === "ORIGINAL/script/events/encounters.js")
      .map((entry) => entry.title);

    expect(encounters).toHaveLength(11);
    expect(encounterTitles).toEqual(canonicalEncounterTitles);
    expect(encounters.map((entry) => entry.scenes.start.combat?.enemy)).toEqual(
      [
        "snarling beast",
        "gaunt man",
        "strange bird",
        "two-headed creature",
        "shivering man",
        "man-eater",
        "scavenger",
        "lizard",
        "feral terror",
        "soldier",
        "sniper",
      ],
    );
    expect(
      encounters.map((entry) => entry.scenes.start.combat?.health),
    ).toEqual([5, 6, 4, 10, 20, 25, 30, 20, 45, 50, 30]);
    expect(
      encounters.filter((entry) => entry.scenes.start.combat?.ranged),
    ).toHaveLength(2);
  });

  it("represents executioner combat definitions and focused executioner event slices", () => {
    const executionerCombats = originalExecutionerCombatDefinitions;

    expect(Object.keys(executionerCombats)).toEqual([
      "mechanical-guard",
      "mechanical-quadruped",
      "broken-medic",
      "defence-turret",
      "ancient-beast",
      "automated-turret",
      "chitinous-horror",
      "chitinous-queen",
      "operative",
      "researcher",
      "unruly-welder",
      "unstable-prototype",
      "murderous-robot",
      "unstable-automaton",
      "malformed-experiment",
      "immortal-wanderer",
    ]);
    expect(executionerCombats["mechanical-guard"]).toMatchObject({
      enemy: "mechanical guard",
      ranged: true,
      damage: 10,
      health: 60,
      loot: {
        "laser rifle": { min: 1, max: 1, chance: 0.8 },
      },
    });
    expect(executionerCombats["broken-medic"]).toMatchObject({
      enemy: "broken medic",
      atHealth: {
        40: "venomous",
      },
    });
    expect(executionerCombats["chitinous-horror"]).toMatchObject({
      enemy: "chitinous horror",
      damage: 1,
      hit: 0.7,
      attackDelay: 0.25,
      health: 60,
      loot: {
        meat: { min: 5, max: 10, chance: 0.8 },
        scales: { min: 5, max: 10, chance: 0.5 },
      },
    });
    expect(executionerCombats["chitinous-queen"]).toMatchObject({
      enemy: "chitinous queen",
      attackDelay: 0.25,
      health: 70,
      loot: {
        meat: { min: 8, max: 12, chance: 0.8 },
        scales: { min: 8, max: 12, chance: 0.5 },
      },
    });
    expect(executionerCombats["operative"]).toMatchObject({
      enemy: "operative",
      damage: 8,
      attackDelay: 2,
      health: 60,
      loot: {
        bayonet: { min: 1, max: 1, chance: 0.5 },
        bullets: { min: 1, max: 5, chance: 0.8 },
        "cured meat": { min: 1, max: 5, chance: 0.8 },
      },
    });
    expect(executionerCombats["researcher"]).toMatchObject({
      enemy: "researcher",
      damage: 1,
      health: 20,
      loot: {
        torch: { min: 1, max: 3, chance: 0.8 },
        cloth: { min: 1, max: 5, chance: 0.8 },
        "cured meat": { min: 1, max: 5, chance: 0.8 },
      },
    });
    expect(executionerCombats["unstable-prototype"].specials).toEqual([
      { delaySeconds: 5, status: "shield" },
    ]);
    expect(executionerCombats["murderous-robot"].specials).toEqual([
      { delaySeconds: 13, status: "energised" },
    ]);
    expect(executionerCombats["malformed-experiment"].specials).toEqual([
      { delaySeconds: 16, status: "enraged" },
    ]);
    expect(executionerCombats["immortal-wanderer"].specials).toEqual([
      {
        delaySeconds: 7,
        status: ["shield", "enraged", "meditation"],
        avoidRepeat: true,
      },
    ]);
    expect(executionerCombats["unstable-automaton"].explosion).toBe(30);
    expect(
      originalEventDefinitions.filter((entry) => entry.pool === "encounter"),
    ).toHaveLength(11);
    const executionerEvents = originalEventDefinitions.filter(
      (entry) => entry.pool === "executioner",
    );
    expect(executionerEvents).toHaveLength(38);
    expect(executionerEvents.map((entry) => entry.key)).toEqual([
      "executioner.intro-defences",
      "executioner.command-wanderer",
      "executioner.command-lounge-cache",
      "executioner.command-lounge-medicine",
      "executioner.antechamber",
      "executioner.intro-webs",
      "executioner.intro-military-camp",
      "executioner.intro-barricade",
      "executioner.engineering-assembly",
      "executioner.engineering-assembly-loot",
      "executioner.engineering-assembly-quiet",
      "executioner.engineering-engine-room",
      "executioner.engineering-engine-room-quiet",
      "executioner.engineering-fire-guard-post",
      "executioner.engineering-rd-blueprint",
      "executioner.medical-checkpoint",
      "executioner.medical-guardians-quiet",
      "executioner.medical-friends-dispatch",
      "executioner.medical-guarded-surgical",
      "executioner.medical-cold-guard",
      "executioner.medical-surgical-explosives",
      "executioner.medical-surgical-medic",
      "executioner.medical-cold-storage",
      "executioner.medical-locker-quadruped",
      "executioner.medical-frozen-automaton",
      "executioner.martial-armory-blast",
      "executioner.martial-right-cabins-blueprint",
      "executioner.martial-scrap-blueprint",
      "executioner.martial-right-silent-cabins",
      "executioner.martial-security-checkpoint",
      "executioner.martial-scrap-sensors",
      "executioner.martial-security-empty-cells",
      "executioner.martial-planning-room-maps",
      "executioner.martial-training-robot",
      "executioner.martial-robot",
      "executioner.engineering-prototype",
      "executioner.medical-experiment",
      "executioner.unstable-automaton",
    ]);
    expect(executionerEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "executioner.intro-defences",
          title: "A Ravaged Battleship",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              notification:
                "the remains of a huge ship are embedded in the earth.",
              text: [
                "the remains of a massive battleship lie here, like a silent sealed city.",
                "it lists to the side in a deep crevasse, cut when it fell from the sky.",
                "the hatches are all sealed, but the hull is blown out just above the dirt, providing an entrance.",
              ],
            }),
            beast: expect.objectContaining({
              notification: "an ancient beast has made these ruins its home.",
              combat: expect.objectContaining({
                enemy: "ancient beast",
                health: 60,
              }),
            }),
            turret: expect.objectContaining({
              notification:
                "as the lights come online, so too do the defence systems.",
              combat: expect.objectContaining({
                enemy: "automated turret",
                ranged: true,
                health: 60,
              }),
            }),
            device: expect.objectContaining({
              text: [
                "beyond the bulkhead is a small antechamber, seemingly untouched by scavengers.",
                "a large hatch grinds open, and the wind rushes in.",
                "a strange device sits on the floor. looks important.",
              ],
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.antechamber",
          title: "A Ravaged Battleship",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "a large hatch opens into a wide corridor.",
                "the corridor leads to a bank of elevators, which appear to be functional.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "engineering",
                  text: "engineering",
                  nextEvent: {
                    0.3: "executioner.engineering-assembly-loot",
                    0.7: "executioner.engineering-engine-room",
                    1: "executioner.engineering-fire-guard-post",
                  },
                }),
                expect.objectContaining({
                  key: "medical",
                  text: "medical",
                  nextEvent: "executioner.medical-checkpoint",
                }),
                expect.objectContaining({
                  key: "martial",
                  text: "martial",
                  nextEvent: {
                    0.3: "executioner.martial-armory-blast",
                    0.6: "executioner.martial-right-cabins-blueprint",
                    1: "executioner.martial-scrap-blueprint",
                  },
                }),
                expect.objectContaining({
                  key: "command",
                  text: "command deck",
                  nextEvent: "executioner.command-wanderer",
                }),
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.intro-webs",
          title: "A Ravaged Battleship",
          scenes: expect.objectContaining({
            webbing: expect.objectContaining({
              text: [
                "thick, sticky webbing covers the walls of the corridor.",
                "deeper into the ship, the darkness seems almost to writhe.",
                "a small knapsack hangs from a cluster of webs, a few feet from the floor.",
              ],
              loot: {
                "cured meat": { min: 1, max: 5, chance: 0.8 },
                bullets: { min: 1, max: 5, chance: 0.5 },
                "energy cell": { min: 1, max: 5, chance: 0.2 },
              },
            }),
            horror: expect.objectContaining({
              notification:
                "a huge arthropod lunges from the shadows, its mandibles thrashing.",
              combat: expect.objectContaining({
                enemy: "chitinous horror",
                attackDelay: 0.25,
                health: 60,
              }),
            }),
            queen: expect.objectContaining({
              notification:
                "the webs part, and a grotesque insect lurches forward.",
              combat: expect.objectContaining({
                enemy: "chitinous queen",
                attackDelay: 0.25,
                health: 70,
              }),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.intro-military-camp",
          title: "A Ravaged Battleship",
          scenes: expect.objectContaining({
            operative: expect.objectContaining({
              notification: "an operative waits in ambush around the corner.",
              combat: expect.objectContaining({
                enemy: "operative",
                health: 60,
              }),
            }),
            camp: expect.objectContaining({
              text: [
                "the military has set up a small camp just inside the ship.",
                "crude attempts have been made to cut into the walls.",
                "scraps of copper wire litter the floor.",
                "two bedrolls are wedged into a corner.",
              ],
              loot: {
                "cured meat": { min: 1, max: 5, chance: 1 },
                torch: { min: 1, max: 3, chance: 0.8 },
                bullets: { min: 1, max: 5, chance: 0.5 },
                "alien alloy": { min: 1, max: 2, chance: 0.2 },
              },
            }),
            researcher: expect.objectContaining({
              notification: "a dusty researcher clumsily hides in the shadows.",
              combat: expect.objectContaining({
                enemy: "researcher",
                health: 20,
              }),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.intro-barricade",
          title: "A Ravaged Battleship",
          scenes: expect.objectContaining({
            barricade: expect.objectContaining({
              text: [
                "debris is stacked in the corridor, forming a low barricade.",
                "the walls are scorched and melted.",
                "behind the barricade, a few weapons lay abandoned.",
              ],
              loot: {
                "laser rifle": { min: 1, max: 3, chance: 1 },
                "energy cell": { min: 1, max: 5, chance: 0.8 },
                "plasma rifle": { min: 1, max: 1, chance: 0.2 },
              },
            }),
            "wanderer-remains": expect.objectContaining({
              text: [
                "the partially devoured remains of several wanderers are piled before a dark corridor.",
                "shuffling noises can be heard from within.",
              ],
              loot: {
                "energy cell": { min: 1, max: 5, chance: 0.5 },
                cloth: { min: 1, max: 5, chance: 0.8 },
              },
            }),
            beast: expect.objectContaining({
              notification: "an ancient beast has made these ruins its home.",
              combat: expect.objectContaining({
                enemy: "ancient beast",
                health: 60,
              }),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.command-wanderer",
          title: "Command Deck",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "the command deck is empty, save for a squat figure sitting motionless in the centre of the room.",
                "in a flash, the figure is standing.",
              ],
            }),
            observe: expect.objectContaining({
              text: [
                "wanderer form, but not quite flesh. not quite metal either. a crystal set into its chest pulses with light.",
                "it says it saw the rebellion coming. said it made arrangements.",
                "says it can't die.",
              ],
            }),
            wanderer: expect.objectContaining({
              notification: "the immortal wanderer attacks.",
              combat: expect.objectContaining({
                enemy: "immortal wanderer",
                specials: [
                  {
                    delaySeconds: 7,
                    status: ["shield", "enraged", "meditation"],
                    avoidRepeat: true,
                  },
                ],
                loot: {
                  "fleet beacon": { min: 1, max: 1, chance: 1 },
                },
              }),
            }),
            cleared: expect.objectContaining({
              text: [
                "the crystal pulses brightly, then goes dark. the assailant shimmers as its shape becomes less defined.",
                "then it is gone.",
                "time to get out of here.",
              ],
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.command-lounge-cache",
          title: "Command Deck",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "the path to the command bridge is wide, walls adorned with decorative shields.",
                "fighting hadn't reached here, it seems.",
              ],
            }),
            guard: expect.objectContaining({
              notification: "tripped a motion sensor.",
              combat: expect.objectContaining({
                enemy: "mechanical guard",
                ranged: true,
                health: 60,
              }),
            }),
            lounge: expect.objectContaining({
              text: [
                "detour through the officer's lounge.",
                "might be something useful here.",
              ],
            }),
            "weapons-cache": expect.objectContaining({
              text: ["small weapons cache in a cabinet.", "lucky."],
              loot: {
                "energy cell": { min: 3, max: 10, chance: 1 },
                grenade: { min: 1, max: 5, chance: 0.8 },
              },
            }),
            wanderer: expect.objectContaining({
              combat: expect.objectContaining({
                enemy: "immortal wanderer",
              }),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.command-lounge-medicine",
          title: "Command Deck",
          scenes: expect.objectContaining({
            guard: expect.objectContaining({
              notification: "tripped a motion sensor.",
              combat: expect.objectContaining({
                enemy: "mechanical guard",
                ranged: true,
                health: 60,
              }),
            }),
            lounge: expect.objectContaining({
              text: [
                "detour through the officer's lounge.",
                "might be something useful here.",
              ],
            }),
            "medical-supplies": expect.objectContaining({
              text: ["found some medical supplies in a discarded bag."],
              loot: {
                hypo: { min: 1, max: 3, chance: 1 },
              },
            }),
            wanderer: expect.objectContaining({
              combat: expect.objectContaining({
                enemy: "immortal wanderer",
              }),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.engineering-assembly",
          title: "Engineering Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "elevator doors open to a blasted corridor. debris covers the floor, piled into makeshift defences.",
                "emergency lighting flickers.",
              ],
            }),
            welder: expect.objectContaining({
              notification: "assembly arms spin wildly out of control.",
              combat: expect.objectContaining({
                enemy: "unruly welder",
                health: 50,
              }),
            }),
            guard: expect.objectContaining({
              notification: "tripped a motion sensor.",
              combat: expect.objectContaining({
                enemy: "mechanical guard",
                ranged: true,
                health: 60,
              }),
            }),
            cleared: expect.objectContaining({
              text: [
                "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
                "one machine thrums with power, and might still work.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "leave",
                  text: "continue",
                  nextEvent: "executioner.engineering-rd-blueprint",
                }),
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.engineering-assembly-loot",
          title: "Engineering Wing",
          scenes: expect.objectContaining({
            assembly: expect.objectContaining({
              text: [
                "an automated assembly line performs its empty routines, long since deprived of materials.",
                "its final works lie forgotten, covered by a thin layer of dust.",
              ],
              loot: {
                "energy cell": { min: 1, max: 5, chance: 0.8 },
                "laser rifle": { min: 1, max: 1, chance: 0.2 },
              },
            }),
            welder: expect.objectContaining({
              notification: "assembly arms spin wildly out of control.",
              combat: expect.objectContaining({
                enemy: "unruly welder",
                health: 50,
              }),
            }),
            guard: expect.objectContaining({
              notification: "tripped a motion sensor.",
              combat: expect.objectContaining({
                enemy: "mechanical guard",
                health: 60,
              }),
            }),
            cleared: expect.objectContaining({
              text: [
                "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
                "one machine thrums with power, and might still work.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "leave",
                  text: "continue",
                  nextEvent: "executioner.engineering-rd-blueprint",
                }),
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.engineering-assembly-quiet",
          title: "Engineering Wing",
          scenes: expect.objectContaining({
            assembly: expect.objectContaining({
              text: [
                "an automated assembly line performs its empty routines, long since deprived of materials.",
                "its final works lie forgotten, covered by a thin layer of dust.",
              ],
              loot: {
                "energy cell": { min: 1, max: 5, chance: 0.8 },
                "laser rifle": { min: 1, max: 1, chance: 0.2 },
              },
            }),
            machinery: expect.objectContaining({
              text: [
                "assembly arms spark and jitter.",
                "a cacophony of decrepit machinery fills the room.",
              ],
            }),
            guard: expect.objectContaining({
              notification: "tripped a motion sensor.",
              combat: expect.objectContaining({
                enemy: "mechanical guard",
                health: 60,
              }),
            }),
            cleared: expect.objectContaining({
              text: [
                "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
                "one machine thrums with power, and might still work.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "leave",
                  text: "continue",
                  nextEvent: "executioner.engineering-rd-blueprint",
                }),
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.engineering-engine-room",
          title: "Engineering Wing",
          scenes: expect.objectContaining({
            turret: expect.objectContaining({
              notification: "one of the defence turrets still works.",
              combat: expect.objectContaining({
                enemy: "defence turret",
                ranged: true,
                health: 50,
              }),
            }),
            "engine-room": expect.objectContaining({
              text: [
                "must have been the engine room, once. the massive machines now stand inert, twisted and scorched by explosions.",
                "the destruction is uniform and precise.",
                "bits of them can be scavenged.",
              ],
              loot: {
                "alien alloy": { min: 2, max: 5, chance: 1 },
              },
            }),
            guard: expect.objectContaining({
              notification: "tripped a motion sensor.",
              combat: expect.objectContaining({
                enemy: "mechanical guard",
                health: 60,
              }),
            }),
            cleared: expect.objectContaining({
              text: [
                "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
                "one machine thrums with power, and might still work.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "leave",
                  text: "continue",
                  nextEvent: "executioner.engineering-rd-blueprint",
                }),
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.engineering-engine-room-quiet",
          title: "Engineering Wing",
          scenes: expect.objectContaining({
            turret: expect.objectContaining({
              notification: "one of the defence turrets still works.",
              combat: expect.objectContaining({
                enemy: "defence turret",
                ranged: true,
                health: 50,
              }),
            }),
            "engine-room": expect.objectContaining({
              text: [
                "must have been the engine room, once. the massive machines now stand inert, twisted and scorched by explosions.",
                "the destruction is uniform and precise.",
                "bits of them can be scavenged.",
              ],
              loot: {
                "alien alloy": { min: 2, max: 5, chance: 1 },
              },
            }),
            "destroyed-engines": expect.objectContaining({
              text: [
                "none of the ship's engines escaped the destruction.",
                "it's no mystery why she no longer flies.",
              ],
            }),
            cleared: expect.objectContaining({
              text: [
                "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
                "one machine thrums with power, and might still work.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "leave",
                  text: "continue",
                  nextEvent: "executioner.engineering-rd-blueprint",
                }),
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.engineering-fire-guard-post",
          title: "Engineering Wing",
          scenes: expect.objectContaining({
            "fire-junction": expect.objectContaining({
              text: [
                "sparks cascade from a reactivated power junction, and catch.",
                "the flames fill the corridor.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "water",
                  text: "extinguish",
                  cost: { water: 5 },
                }),
                expect.objectContaining({
                  key: "run",
                  text: "rush through",
                  cost: { hp: 10 },
                }),
              ]),
            }),
            guard: expect.objectContaining({
              notification: "tripped a motion sensor.",
              combat: expect.objectContaining({
                enemy: "mechanical guard",
                health: 60,
              }),
            }),
            "robot-hangar": expect.objectContaining({
              text: [
                "rows of inert security robots hang suspended from the ceiling.",
                "wires run overhead, corroded and useless.",
              ],
            }),
            "guard-post": expect.objectContaining({
              text: [
                "more signs of past combat down the hall. guard post is ransacked.",
                "still, some things can be found.",
              ],
              loot: {
                "energy cell": { min: 1, max: 5, chance: 0.8 },
                "laser rifle": { min: 1, max: 1, chance: 0.7 },
                grenade: { min: 1, max: 3, chance: 0.6 },
                "plasma rifle": { min: 1, max: 1, chance: 0.2 },
              },
            }),
            cleared: expect.objectContaining({
              text: [
                "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
                "one machine thrums with power, and might still work.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "leave",
                  text: "continue",
                  nextEvent: "executioner.engineering-rd-blueprint",
                }),
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.engineering-rd-blueprint",
          title: "Engineering Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "marks on the door read 'research and development.' everything seems mostly untouched, but dead.",
                "one machine thrums with power, and might still work.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "use",
                  text: "use machine",
                  cost: { "alien alloy": 1 },
                }),
              ]),
            }),
            healed: expect.objectContaining({
              text: [
                "step inside, and the machine whirs. muscle and bone reknit. good as new.",
              ],
            }),
            turret: expect.objectContaining({
              notification: "one of the defence turrets still works.",
              combat: expect.objectContaining({
                enemy: "defence turret",
                health: 50,
              }),
            }),
            workbenches: expect.objectContaining({
              text: [
                "the machines here look unfinished, abandoned by their creator. wires and other scrap are scattered about the work benches.",
              ],
            }),
            plans: expect.objectContaining({
              text: [
                "experimental plans cover one wall, held by an unseen force.",
                "this one looks useful.",
              ],
              loot: {
                "hypo blueprint": { min: 1, max: 1, chance: 1 },
              },
            }),
            prototype: expect.objectContaining({
              notification: "an unfinished automaton whirs to life.",
              combat: expect.objectContaining({
                enemy: "unstable prototype",
                specials: [{ delaySeconds: 5, status: "shield" }],
              }),
            }),
            cleared: expect.objectContaining({
              text: [
                "at the back of the workshop, elevator doors twitch and buzz.",
                "looks like a way out of here.",
              ],
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.medical-checkpoint",
          title: "Medical Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "elevator doors open to an empty corridor.",
                "a few dusty corpses can be seen further down, but this deck appears to have been spared most of the combat.",
              ],
            }),
            "quiet-corridor": expect.objectContaining({
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "continue",
                  nextScene: { 0.5: "quadruped", 1: "guardians" },
                }),
              ]),
            }),
            turret: expect.objectContaining({
              notification: "one of the defence turrets still works.",
              combat: expect.objectContaining({
                enemy: "defence turret",
                ranged: true,
                health: 50,
              }),
            }),
            guardians: expect.objectContaining({
              text: [
                "automated guardians still stalk the halls, unaware that their masters have long gone.",
                "clumsy machines, and easily avoided.",
              ],
            }),
            gurneys: expect.objectContaining({
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "continue",
                  nextScene: { 0.5: "medic", 1: "strategy-room" },
                }),
              ]),
            }),
            "strategy-room": expect.objectContaining({
              text: [
                "this ward has been converted to a makeshift strategy room, maps scrawled hastily on any flat surface.",
                "a secure locker is set into one wall.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "force",
                  text: "force locker",
                  nextScene: { 1: "locker" },
                }),
                expect.objectContaining({
                  key: "continue",
                  text: "continue",
                  nextScene: { 1: "quiet-move" },
                }),
              ]),
            }),
            locker: expect.objectContaining({
              text: ["hinges rusted through. no challenge."],
              loot: {
                "energy cell": { min: 5, max: 10, chance: 1 },
                hypo: { min: 1, max: 3, chance: 1 },
              },
            }),
            "quiet-move": expect.objectContaining({
              text: [
                "better to move without drawing attention.",
                "noises can be heard from the corridor outside.",
              ],
            }),
            "noisy-medic": expect.objectContaining({
              notification: "the noise draws attention.",
              combat: expect.objectContaining({
                enemy: "broken medic",
                atHealth: {
                  40: "venomous",
                },
              }),
            }),
            "strategy-quadruped": expect.objectContaining({
              notification:
                "a mobile defence platform trundles around the corner.",
              combat: expect.objectContaining({
                enemy: "mechanical quadruped",
                health: 70,
              }),
            }),
            quadruped: expect.objectContaining({
              notification:
                "a mobile defence platform trundles around the corner.",
              combat: expect.objectContaining({
                enemy: "mechanical quadruped",
                health: 70,
              }),
            }),
            medic: expect.objectContaining({
              notification: "a medical drone wheels out of control.",
              combat: expect.objectContaining({
                enemy: "broken medic",
                atHealth: {
                  40: "venomous",
                },
              }),
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "leave",
                  nextScene: { 0.5: "friends", 1: "frozen-robots" },
                }),
              ]),
            }),
            friends: expect.objectContaining({
              notification: "it had friends.",
              combat: expect.objectContaining({
                enemy: "broken medic",
                atHealth: {
                  40: "venomous",
                },
              }),
            }),
            "frozen-robots": expect.objectContaining({
              text: [
                "more medical robots stand frozen, attached by a network of wires.",
                "they take no notice of the intrusion.",
              ],
            }),
            cleared: expect.objectContaining({
              text: [
                "weapons are strewn about the medical dispatch bay. must have been used as a muster point.",
                "more strange graffiti adorns the walls.",
              ],
              loot: {
                "laser rifle": { min: 1, max: 1, chance: 1 },
                "energy cell": { min: 3, max: 10, chance: 1 },
              },
            }),
            automaton: expect.objectContaining({
              notification: "something's wrong with this robot.",
              combat: expect.objectContaining({
                enemy: "unstable automaton",
                explosion: 30,
              }),
            }),
            checkpoint: expect.objectContaining({
              text: [
                "another checkpoint ahead, fitted with heavy doors.",
                "security is even tighter here.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "leave",
                  text: "continue",
                  nextEvent: {
                    0.25: "executioner.medical-cold-guard",
                    0.5: "executioner.medical-guarded-surgical",
                    1: "executioner.medical-cold-storage",
                  },
                }),
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.medical-friends-dispatch",
          title: "Medical Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "medical gurneys are fixed to grooves running down the corridor walls.",
                "the automated patient transport system now sits motionless.",
              ],
            }),
            medic: expect.objectContaining({
              notification: "a medical drone wheels out of control.",
              combat: expect.objectContaining({
                enemy: "broken medic",
                atHealth: {
                  40: "venomous",
                },
              }),
            }),
            friends: expect.objectContaining({
              notification: "it had friends.",
              combat: expect.objectContaining({
                enemy: "broken medic",
                atHealth: {
                  40: "venomous",
                },
              }),
            }),
            "dispatch-bay": expect.objectContaining({
              text: [
                "weapons are strewn about the medical dispatch bay. must have been used as a muster point.",
                "more strange graffiti adorns the walls.",
              ],
              loot: {
                "laser rifle": { min: 1, max: 1, chance: 1 },
                "energy cell": { min: 3, max: 10, chance: 1 },
              },
            }),
            automaton: expect.objectContaining({
              notification: "something's wrong with this robot.",
              combat: expect.objectContaining({
                enemy: "unstable automaton",
                explosion: 30,
              }),
            }),
            checkpoint: expect.objectContaining({
              text: [
                "another checkpoint ahead, fitted with heavy doors.",
                "security is even tighter here.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "leave",
                  text: "continue",
                  nextEvent: "executioner.medical-cold-storage",
                }),
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.medical-guardians-quiet",
          title: "Medical Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "past the checkpoint, the corridor is undamaged save for sporadic graffiti.",
                "there was no fighting here.",
              ],
            }),
            guardians: expect.objectContaining({
              text: [
                "automated guardians still stalk the halls, unaware that their masters have long gone.",
                "clumsy machines, and easily avoided.",
              ],
            }),
            gurneys: expect.objectContaining({
              text: [
                "medical gurneys are fixed to grooves running down the corridor walls.",
                "the automated patient transport system now sits motionless.",
              ],
            }),
            "strategy-room": expect.objectContaining({
              text: [
                "this ward has been converted to a makeshift strategy room, maps scrawled hastily on any flat surface.",
                "a secure locker is set into one wall.",
              ],
            }),
            "quiet-move": expect.objectContaining({
              text: [
                "better to move without drawing attention.",
                "noises can be heard from the corridor outside.",
              ],
            }),
            quadruped: expect.objectContaining({
              notification:
                "a mobile defence platform trundles around the corner.",
              combat: expect.objectContaining({
                enemy: "mechanical quadruped",
                health: 70,
              }),
            }),
            automaton: expect.objectContaining({
              notification: "something's wrong with this robot.",
              combat: expect.objectContaining({
                enemy: "unstable automaton",
                explosion: 30,
              }),
            }),
            checkpoint: expect.objectContaining({
              text: [
                "another checkpoint ahead, fitted with heavy doors.",
                "security is even tighter here.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "leave",
                  text: "continue",
                  nextEvent: "executioner.medical-cold-storage",
                }),
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.medical-guarded-surgical",
          title: "Medical Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "another checkpoint ahead, fitted with heavy doors.",
                "security is even tighter here.",
              ],
            }),
            guard: expect.objectContaining({
              notification: "tripped a motion sensor.",
              combat: expect.objectContaining({
                enemy: "mechanical guard",
                ranged: true,
                health: 60,
              }),
            }),
            medic: expect.objectContaining({
              notification: "a medical drone wheels out of control.",
              combat: expect.objectContaining({
                enemy: "broken medic",
                atHealth: {
                  40: "venomous",
                },
              }),
            }),
            "surgical-tools": expect.objectContaining({
              text: [
                "surgical tools are scattered on the floor, near what appears the be the remains of a fire.",
                "strange.",
              ],
            }),
            explosives: expect.objectContaining({
              text: [
                "the air in this room has a metallic tinge. floor is covered in dark powder.",
                "some completed explosives in the corner.",
              ],
              loot: {
                grenade: { min: 3, max: 8, chance: 1 },
              },
            }),
            "final-medic": expect.objectContaining({
              notification: "a medical drone wheels out of control.",
              combat: expect.objectContaining({
                enemy: "broken medic",
                atHealth: {
                  40: "venomous",
                },
              }),
            }),
            containment: expect.objectContaining({
              text: [
                "containment cells arranged at the back of the room, all open.",
                "something moving up ahead.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "leave",
                  text: "continue",
                  nextEvent: "executioner.medical-experiment",
                }),
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.medical-surgical-explosives",
          title: "Medical Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "surgical tools are scattered on the floor, near what appears the be the remains of a fire.",
                "strange.",
              ],
            }),
            explosives: expect.objectContaining({
              text: [
                "the air in this room has a metallic tinge. floor is covered in dark powder.",
                "some completed explosives in the corner.",
              ],
              loot: {
                grenade: { min: 3, max: 8, chance: 1 },
              },
            }),
            "final-medic": expect.objectContaining({
              notification: "a medical drone wheels out of control.",
              combat: expect.objectContaining({
                enemy: "broken medic",
                atHealth: {
                  40: "venomous",
                },
              }),
            }),
            containment: expect.objectContaining({
              text: [
                "containment cells arranged at the back of the room, all open.",
                "something moving up ahead.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "leave",
                  text: "continue",
                  nextEvent: "executioner.medical-experiment",
                }),
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.medical-cold-guard",
          title: "Medical Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "another checkpoint ahead, fitted with heavy doors.",
                "security is even tighter here.",
              ],
            }),
            guard: expect.objectContaining({
              notification: "tripped a motion sensor.",
              combat: expect.objectContaining({
                enemy: "mechanical guard",
                ranged: true,
                health: 60,
              }),
            }),
            medic: expect.objectContaining({
              notification: "a medical drone wheels out of control.",
              combat: expect.objectContaining({
                enemy: "broken medic",
                atHealth: {
                  40: "venomous",
                },
              }),
            }),
            "cold-storage": expect.objectContaining({
              text: [
                "the air is cooler here. low cabinets ring the room, doors dusted with frost.",
                "samples of something biological inside.",
              ],
              loot: {
                "cured meat": { min: 5, max: 10, chance: 1 },
              },
            }),
            "second-guard": expect.objectContaining({
              notification: "tripped a motion sensor.",
              combat: expect.objectContaining({
                enemy: "mechanical guard",
                ranged: true,
                health: 60,
              }),
            }),
            "final-medic": expect.objectContaining({
              notification: "a medical drone wheels out of control.",
              combat: expect.objectContaining({
                enemy: "broken medic",
                atHealth: {
                  40: "venomous",
                },
              }),
            }),
            containment: expect.objectContaining({
              text: [
                "containment cells arranged at the back of the room, all open.",
                "something moving up ahead.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "leave",
                  text: "continue",
                  nextEvent: "executioner.medical-experiment",
                }),
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.medical-surgical-medic",
          title: "Medical Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "surgical tools are scattered on the floor, near what appears the be the remains of a fire.",
                "strange.",
              ],
            }),
            medic: expect.objectContaining({
              notification: "a medical drone wheels out of control.",
              combat: expect.objectContaining({
                enemy: "broken medic",
                atHealth: {
                  40: "venomous",
                },
              }),
            }),
            "final-medic": expect.objectContaining({
              notification: "a medical drone wheels out of control.",
              combat: expect.objectContaining({
                enemy: "broken medic",
                atHealth: {
                  40: "venomous",
                },
              }),
            }),
            containment: expect.objectContaining({
              text: [
                "containment cells arranged at the back of the room, all open.",
                "something moving up ahead.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "leave",
                  text: "continue",
                  nextEvent: "executioner.medical-experiment",
                }),
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.medical-cold-storage",
          title: "Medical Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "another checkpoint ahead, fitted with heavy doors.",
                "security is even tighter here.",
              ],
            }),
            slipped: expect.objectContaining({
              text: [
                "slipped through unnoticed.",
                "air whistles as the doors open. this section must have lower pressure than the rest of the ship.",
              ],
            }),
            medic: expect.objectContaining({
              notification: "a medical drone wheels out of control.",
              combat: expect.objectContaining({
                enemy: "broken medic",
                atHealth: {
                  40: "venomous",
                },
              }),
            }),
            "cold-storage": expect.objectContaining({
              text: [
                "the air is cooler here. low cabinets ring the room, doors dusted with frost.",
                "samples of something biological inside.",
              ],
              loot: {
                "cured meat": { min: 5, max: 10, chance: 1 },
              },
            }),
            drones: expect.objectContaining({
              text: [
                "security drones still patrol the hallways.",
                "predictable paths.",
              ],
            }),
            "final-medic": expect.objectContaining({
              notification: "a medical drone wheels out of control.",
              combat: expect.objectContaining({
                enemy: "broken medic",
                atHealth: {
                  40: "venomous",
                },
              }),
            }),
            containment: expect.objectContaining({
              text: [
                "containment cells arranged at the back of the room, all open.",
                "something moving up ahead.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "leave",
                  text: "continue",
                  nextEvent: "executioner.medical-experiment",
                }),
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.medical-locker-quadruped",
          title: "Medical Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "this ward has been converted to a makeshift strategy room, maps scrawled hastily on any flat surface.",
                "a secure locker is set into one wall.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "force",
                  text: "force locker",
                }),
              ]),
            }),
            locker: expect.objectContaining({
              text: ["hinges rusted through. no challenge."],
              loot: {
                "energy cell": { min: 5, max: 10, chance: 1 },
                hypo: { min: 1, max: 3, chance: 1 },
              },
            }),
            "quiet-move": expect.objectContaining({
              text: [
                "better to move without drawing attention.",
                "noises can be heard from the corridor outside.",
              ],
            }),
            "noisy-medic": expect.objectContaining({
              notification: "the noise draws attention.",
              combat: expect.objectContaining({
                enemy: "broken medic",
                atHealth: {
                  40: "venomous",
                },
              }),
            }),
            quadruped: expect.objectContaining({
              notification:
                "a mobile defence platform trundles around the corner.",
              combat: expect.objectContaining({
                enemy: "mechanical quadruped",
                health: 70,
              }),
            }),
            automaton: expect.objectContaining({
              notification: "something's wrong with this robot.",
              combat: expect.objectContaining({
                enemy: "unstable automaton",
                explosion: 30,
              }),
            }),
            checkpoint: expect.objectContaining({
              text: [
                "another checkpoint ahead, fitted with heavy doors.",
                "security is even tighter here.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "leave",
                  text: "continue",
                  nextEvent: "executioner.medical-cold-storage",
                }),
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.medical-frozen-automaton",
          title: "Medical Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "medical gurneys are fixed to grooves running down the corridor walls.",
                "the automated patient transport system now sits motionless.",
              ],
            }),
            medic: expect.objectContaining({
              notification: "a medical drone wheels out of control.",
              combat: expect.objectContaining({
                enemy: "broken medic",
                atHealth: {
                  40: "venomous",
                },
              }),
            }),
            "frozen-robots": expect.objectContaining({
              text: [
                "more medical robots stand frozen, attached by a network of wires.",
                "they take no notice of the intrusion.",
              ],
            }),
            "dispatch-bay": expect.objectContaining({
              text: [
                "weapons are strewn about the medical dispatch bay. must have been used as a muster point.",
                "more strange graffiti adorns the walls.",
              ],
              loot: {
                "laser rifle": { min: 1, max: 1, chance: 1 },
                "energy cell": { min: 3, max: 10, chance: 1 },
              },
            }),
            automaton: expect.objectContaining({
              notification: "something's wrong with this robot.",
              combat: expect.objectContaining({
                enemy: "unstable automaton",
                explosion: 30,
                loot: {
                  "glowstone blueprint": { min: 1, max: 1, chance: 1 },
                },
              }),
            }),
            checkpoint: expect.objectContaining({
              text: [
                "another checkpoint ahead, fitted with heavy doors.",
                "security is even tighter here.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "leave",
                  text: "continue",
                  nextEvent: "executioner.medical-cold-storage",
                }),
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.martial-armory-blast",
          title: "Martial Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "metal grinds, and the elevator doors open halfway. beyond is a brightly lit battlefield. remains litter the corridor, undisturbed by scavengers.",
                "looks like they tried to barricade the elevators.",
              ],
            }),
            branch: expect.objectContaining({
              text: [
                "further along, the corridor branches.",
                "the door to the left is sealed and refuses to open.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "blast",
                  text: "blast door",
                  cost: { grenade: 1 },
                }),
              ]),
            }),
            armory: expect.objectContaining({
              text: [
                "the blast throws the door inwards.",
                "through the bulkhead is a large room, walls lined with weapon racks. fighting seems to have passed it by.",
              ],
              loot: {
                "energy blade": { min: 2, max: 5, chance: 1 },
                "laser rifle": { min: 2, max: 5, chance: 1 },
                "energy cell": { min: 5, max: 20, chance: 1 },
                grenade: { min: 1, max: 5, chance: 0.8 },
                "plasma rifle": { min: 1, max: 1, chance: 0.2 },
              },
            }),
            turret: expect.objectContaining({
              notification: "one of the defence turrets still works.",
              combat: expect.objectContaining({
                enemy: "defence turret",
                health: 50,
              }),
            }),
            "sealed-door": expect.objectContaining({
              text: [
                "another door at the end of the hall, sealed from this side.",
                "should be able to open it.",
              ],
            }),
            documents: expect.objectContaining({
              text: [
                "documents are scattered down the hall, most charred and curled.",
                "this one looks interesting.",
              ],
              loot: {
                "plasma rifle blueprint": { min: 1, max: 1, chance: 1 },
              },
            }),
            "training-complex": expect.objectContaining({
              text: [
                "the corridor opens onto a vast training complex, obstacles and features blackened by real combat.",
                "a regenerative machine hums uncannily by one of the courses.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "continue",
                  text: "continue",
                  nextEvent: "executioner.martial-training-robot",
                }),
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.martial-right-cabins-blueprint",
          title: "Martial Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "metal grinds, and the elevator doors open halfway. beyond is a brightly lit battlefield. remains litter the corridor, undisturbed by scavengers.",
                "looks like they tried to barricade the elevators.",
              ],
            }),
            branch: expect.objectContaining({
              text: [
                "further along, the corridor branches.",
                "the door to the left is sealed and refuses to open.",
              ],
            }),
            turret: expect.objectContaining({
              notification: "one of the defence turrets still works.",
              combat: expect.objectContaining({
                enemy: "defence turret",
                health: 50,
              }),
            }),
            quadruped: expect.objectContaining({
              notification:
                "a mobile defence platform trundles around the corner.",
              combat: expect.objectContaining({
                enemy: "mechanical quadruped",
                health: 70,
              }),
            }),
            cabins: expect.objectContaining({
              text: [
                "crew cabins flank the hall, devoid of life.",
                "a few useful items can be scavenged.",
              ],
              loot: {
                "energy cell": { min: 1, max: 5, chance: 1 },
                "energy blade": { min: 1, max: 1, chance: 0.2 },
              },
            }),
            documents: expect.objectContaining({
              text: [
                "documents are scattered down the hall, most charred and curled.",
                "this one looks interesting.",
              ],
              loot: {
                "plasma rifle blueprint": { min: 1, max: 1, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.martial-scrap-blueprint",
          title: "Martial Wing",
          scenes: expect.objectContaining({
            scrap: expect.objectContaining({
              text: [
                "ruined defence turrets flank the corridor.",
                "could put the scrap to good use.",
              ],
              loot: {
                "alien alloy": { min: 1, max: 3, chance: 1 },
              },
            }),
            guard: expect.objectContaining({
              notification: "tripped a motion sensor.",
              combat: expect.objectContaining({
                enemy: "mechanical guard",
                health: 60,
              }),
            }),
            quadruped: expect.objectContaining({
              notification:
                "a mobile defence platform trundles around the corner.",
              combat: expect.objectContaining({
                enemy: "mechanical quadruped",
                health: 70,
              }),
            }),
            barricade: expect.objectContaining({
              text: [
                "large barricades bisect the corridor, scorched by weapons fire.",
                "bodies litter the ground on either side.",
              ],
            }),
            documents: expect.objectContaining({
              loot: {
                "plasma rifle blueprint": { min: 1, max: 1, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.martial-right-silent-cabins",
          title: "Martial Wing",
          scenes: expect.objectContaining({
            turret: expect.objectContaining({
              notification: "one of the defence turrets still works.",
              combat: expect.objectContaining({
                enemy: "defence turret",
                health: 50,
              }),
            }),
            "silent-corridor": expect.objectContaining({
              text: ["the corridor is eerily silent."],
            }),
            cabins: expect.objectContaining({
              text: [
                "crew cabins flank the hall, devoid of life.",
                "a few useful items can be scavenged.",
              ],
              loot: {
                "energy cell": { min: 1, max: 5, chance: 1 },
                "energy blade": { min: 1, max: 1, chance: 0.2 },
              },
            }),
            barricade: expect.objectContaining({
              text: [
                "large barricades bisect the corridor, scorched by weapons fire.",
                "bodies litter the ground on either side.",
              ],
            }),
            documents: expect.objectContaining({
              loot: {
                "plasma rifle blueprint": { min: 1, max: 1, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.martial-security-checkpoint",
          title: "Martial Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "documents are scattered down the hall, most charred and curled.",
                "this one looks interesting.",
              ],
              loot: {
                "plasma rifle blueprint": { min: 1, max: 1, chance: 1 },
              },
            }),
            checkpoint: expect.objectContaining({
              text: [
                "the corridor passes through a security checkpoint. the defences are blown apart, ragged edges scorched by laser fire.",
                "past the checkpoint, banks of containment cells can be seen.",
              ],
            }),
            "dead-guards": expect.objectContaining({
              text: [
                "the guards died at their posts, shot through with superheated plasma.",
                "their weapons lie on the floor beside them.",
              ],
              loot: {
                "laser rifle": { min: 2, max: 2, chance: 1 },
                "energy cell": { min: 5, max: 10, chance: 1 },
              },
            }),
            quadruped: expect.objectContaining({
              notification:
                "a mobile defence platform trundles around the corner.",
              combat: expect.objectContaining({
                enemy: "mechanical quadruped",
                health: 70,
              }),
            }),
            "training-complex": expect.objectContaining({
              text: [
                "the corridor opens onto a vast training complex, obstacles and features blackened by real combat.",
                "a regenerative machine hums uncannily by one of the courses.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "continue",
                  text: "continue",
                  nextEvent: "executioner.martial-training-robot",
                }),
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.martial-scrap-sensors",
          title: "Martial Wing",
          scenes: expect.objectContaining({
            scrap: expect.objectContaining({
              text: [
                "ruined defence turrets flank the corridor.",
                "could put the scrap to good use.",
              ],
              loot: {
                "alien alloy": { min: 1, max: 3, chance: 1 },
              },
            }),
            sensors: expect.objectContaining({
              text: [
                "small sensors in the walls still look to be operational.",
                "easily avoided.",
              ],
            }),
            quadruped: expect.objectContaining({
              notification:
                "a mobile defence platform trundles around the corner.",
              combat: expect.objectContaining({
                enemy: "mechanical quadruped",
                health: 70,
              }),
            }),
            barricade: expect.objectContaining({
              text: [
                "large barricades bisect the corridor, scorched by weapons fire.",
                "bodies litter the ground on either side.",
              ],
            }),
            documents: expect.objectContaining({
              loot: {
                "plasma rifle blueprint": { min: 1, max: 1, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.martial-security-empty-cells",
          title: "Martial Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "documents are scattered down the hall, most charred and curled.",
                "this one looks interesting.",
              ],
              loot: {
                "plasma rifle blueprint": { min: 1, max: 1, chance: 1 },
              },
            }),
            checkpoint: expect.objectContaining({
              text: [
                "the corridor passes through a security checkpoint. the defences are blown apart, ragged edges scorched by laser fire.",
                "past the checkpoint, banks of containment cells can be seen.",
              ],
            }),
            "empty-cells": expect.objectContaining({
              text: [
                "the cells are all empty.",
                "power cables running across the ceiling are split in several places, sparking occasionally.",
              ],
            }),
            quadruped: expect.objectContaining({
              notification:
                "a mobile defence platform trundles around the corner.",
              combat: expect.objectContaining({
                enemy: "mechanical quadruped",
                health: 70,
              }),
            }),
            "training-complex": expect.objectContaining({
              text: [
                "the corridor opens onto a vast training complex, obstacles and features blackened by real combat.",
                "a regenerative machine hums uncannily by one of the courses.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "continue",
                  text: "continue",
                  nextEvent: "executioner.martial-training-robot",
                }),
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.martial-planning-room-maps",
          title: "Martial Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              loot: {
                "plasma rifle blueprint": { min: 1, max: 1, chance: 1 },
              },
            }),
            "planning-room": expect.objectContaining({
              text: [
                "the next door leads to a ransacked planning room.",
                "maps of the surface can still be found amongst the debris.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "scavenge",
                  text: "scavenge maps",
                }),
              ]),
            }),
            "noisy-guard": expect.objectContaining({
              notification: "drew some attention with all that noise.",
              combat: expect.objectContaining({
                enemy: "mechanical guard",
                health: 60,
              }),
            }),
            sentry: expect.objectContaining({
              text: [
                "slipped past an automated sentry.",
                "if only they'd been destroyed along with everything else.",
              ],
            }),
            "second-guard": expect.objectContaining({
              notification: "ran straight into another one.",
              combat: expect.objectContaining({
                enemy: "mechanical guard",
                health: 60,
              }),
            }),
            "training-complex": expect.objectContaining({
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "continue",
                  text: "continue",
                  nextEvent: "executioner.martial-training-robot",
                }),
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.martial-training-robot",
          title: "Martial Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "the corridor opens onto a vast training complex, obstacles and features blackened by real combat.",
                "a regenerative machine hums uncannily by one of the courses.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "use",
                  text: "use machine",
                  cost: { "alien alloy": 1 },
                }),
                expect.objectContaining({
                  key: "continue",
                  text: "continue",
                }),
              ]),
            }),
            "robot-intro": expect.objectContaining({
              text: [
                "motion from the centre of the yard.",
                "a sparring automaton, still fully function and crusted with timeworn blood, lunges forward.",
              ],
            }),
            robot: expect.objectContaining({
              notification: "the machine attacks, blades whirling.",
              combat: expect.objectContaining({
                enemy: "murderous robot",
                specials: [{ delaySeconds: 13, status: "energised" }],
                loot: {
                  "alien alloy": { min: 1, max: 3, chance: 1 },
                  "disruptor blueprint": { min: 1, max: 1, chance: 1 },
                },
              }),
            }),
            cleared: expect.objectContaining({
              text: [
                "the ruins of the sparring machine clatter to the ground.",
                "picked this deck clean.",
              ],
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.martial-robot",
          title: "Martial Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "motion from the centre of the yard.",
                "a sparring automaton, still fully function and crusted with timeworn blood, lunges forward.",
              ],
            }),
            robot: expect.objectContaining({
              notification: "the machine attacks, blades whirling.",
              combat: expect.objectContaining({
                enemy: "murderous robot",
                specials: [{ delaySeconds: 13, status: "energised" }],
                loot: {
                  "alien alloy": { min: 1, max: 3, chance: 1 },
                  "disruptor blueprint": { min: 1, max: 1, chance: 1 },
                },
              }),
            }),
            cleared: expect.objectContaining({
              text: [
                "the ruins of the sparring machine clatter to the ground.",
                "picked this deck clean.",
              ],
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.engineering-prototype",
          title: "Engineering Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: ["clattering metal and old servos. something is coming..."],
            }),
            prototype: expect.objectContaining({
              notification: "an unfinished automaton whirs to life.",
              combat: expect.objectContaining({
                enemy: "unstable prototype",
                specials: [{ delaySeconds: 5, status: "shield" }],
                loot: {
                  "alien alloy": { min: 1, max: 3, chance: 1 },
                  "kinetic armour blueprint": {
                    min: 1,
                    max: 1,
                    chance: 1,
                  },
                },
              }),
            }),
            cleared: expect.objectContaining({
              text: [
                "at the back of the workshop, elevator doors twitch and buzz.",
                "looks like a way out of here.",
              ],
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.medical-experiment",
          title: "Medical Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "containment cells arranged at the back of the room, all open.",
                "something moving up ahead.",
              ],
            }),
            experiment: expect.objectContaining({
              notification: "a mutated beast leaps from its cell.",
              combat: expect.objectContaining({
                enemy: "malformed experiment",
                specials: [{ delaySeconds: 16, status: "enraged" }],
                loot: {
                  "stim blueprint": { min: 1, max: 1, chance: 1 },
                },
              }),
            }),
            cleared: expect.objectContaining({
              text: [
                "the creature's tortured breathing ceases.",
                "nothing more here.",
              ],
            }),
          }),
        }),
        expect.objectContaining({
          key: "executioner.unstable-automaton",
          title: "Medical Wing",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              notification: "something's wrong with this robot.",
              combat: expect.objectContaining({
                enemy: "unstable automaton",
                explosion: 30,
                loot: {
                  "glowstone blueprint": { min: 1, max: 1, chance: 1 },
                },
              }),
            }),
          }),
        }),
      ]),
    );
  });

  it("represents focused setpiece combat definitions and mine traversal slices", () => {
    const setpieceCombats = originalSetpieceCombatDefinitions;

    expect(Object.keys(setpieceCombats)).toEqual([
      "cave-beast",
      "cave-small-beast",
      "cave-large-beast",
      "cave-lizard",
      "cave-giant-lizard",
      "town-thug",
      "town-scavenger",
      "town-beast",
      "town-vigilante",
      "town-madman",
      "house-squatter",
      "city-sniper",
      "city-soldier",
      "city-commando",
      "city-thug",
      "city-bird",
      "city-beast",
      "city-old-man",
      "city-lizard",
      "city-lizards",
      "city-squatters",
      "city-crowd-squatters",
      "city-deformed",
      "city-tentacles",
      "city-rats",
      "city-veteran",
      "city-frail-man",
      "city-youth",
      "city-squatter",
      "sulphurmine-veteran",
      "coalmine-man",
      "coalmine-chief",
      "ironmine-matriarch",
    ]);
    expect(setpieceCombats["cave-beast"]).toMatchObject({
      enemy: "beast",
      damage: 1,
      attackDelay: 1,
      health: 5,
      loot: {
        fur: { min: 1, max: 10, chance: 1 },
        teeth: { min: 1, max: 5, chance: 0.8 },
      },
    });
    expect(setpieceCombats["cave-small-beast"]).toMatchObject({
      enemy: "beast",
      damage: 1,
      attackDelay: 1,
      health: 5,
      loot: {
        fur: { min: 1, max: 3, chance: 1 },
        teeth: { min: 1, max: 2, chance: 0.8 },
      },
    });
    expect(setpieceCombats["cave-large-beast"]).toMatchObject({
      enemy: "beast",
      damage: 3,
      attackDelay: 2,
      health: 10,
      loot: {
        fur: { min: 1, max: 3, chance: 1 },
        teeth: { min: 1, max: 3, chance: 1 },
      },
    });
    expect(setpieceCombats["cave-lizard"]).toMatchObject({
      enemy: "cave lizard",
      damage: 3,
      attackDelay: 2,
      health: 6,
      loot: {
        scales: { min: 1, max: 3, chance: 1 },
        teeth: { min: 1, max: 2, chance: 0.8 },
      },
    });
    expect(setpieceCombats["cave-giant-lizard"]).toMatchObject({
      enemy: "lizard",
      damage: 4,
      attackDelay: 2,
      health: 10,
      loot: {
        scales: { min: 1, max: 3, chance: 1 },
        teeth: { min: 1, max: 3, chance: 1 },
      },
    });
    expect(setpieceCombats["town-thug"]).toMatchObject({
      enemy: "thug",
      damage: 4,
      health: 30,
      loot: {
        cloth: { min: 5, max: 10, chance: 0.8 },
        leather: { min: 5, max: 10, chance: 0.8 },
        "cured meat": { min: 1, max: 5, chance: 0.5 },
      },
    });
    expect(setpieceCombats["town-scavenger"]).toMatchObject({
      enemy: "scavenger",
      damage: 5,
      health: 30,
      loot: {
        "cured meat": { min: 1, max: 5, chance: 1 },
        leather: { min: 5, max: 10, chance: 0.8 },
        "steel sword": { min: 1, max: 1, chance: 0.5 },
      },
    });
    expect(setpieceCombats["town-beast"]).toMatchObject({
      enemy: "beast",
      damage: 3,
      health: 25,
      loot: {
        teeth: { min: 1, max: 5, chance: 1 },
        fur: { min: 5, max: 10, chance: 1 },
      },
    });
    expect(setpieceCombats["town-vigilante"]).toMatchObject({
      enemy: "vigilante",
      damage: 6,
      health: 30,
      loot: {
        "cured meat": { min: 1, max: 5, chance: 1 },
        leather: { min: 5, max: 10, chance: 0.8 },
        "steel sword": { min: 1, max: 1, chance: 0.5 },
      },
    });
    expect(setpieceCombats["town-madman"]).toMatchObject({
      enemy: "madman",
      damage: 6,
      hit: 0.3,
      attackDelay: 1,
      health: 10,
      loot: {
        cloth: { min: 2, max: 4, chance: 0.3 },
        "cured meat": { min: 1, max: 5, chance: 0.9 },
        medicine: { min: 1, max: 2, chance: 0.4 },
      },
    });
    expect(setpieceCombats["house-squatter"]).toMatchObject({
      enemy: "squatter",
      damage: 3,
      health: 10,
      loot: {
        "cured meat": { min: 1, max: 10, chance: 0.8 },
        leather: { min: 1, max: 10, chance: 0.2 },
        cloth: { min: 1, max: 10, chance: 0.5 },
      },
    });
    expect(setpieceCombats["city-sniper"]).toMatchObject({
      enemy: "sniper",
      ranged: true,
      damage: 15,
      health: 30,
      loot: {
        "cured meat": { min: 1, max: 5, chance: 0.8 },
        bullets: { min: 1, max: 5, chance: 0.5 },
        rifle: { min: 1, max: 1, chance: 0.2 },
      },
    });
    expect(setpieceCombats["city-soldier"]).toMatchObject({
      enemy: "soldier",
      ranged: true,
      damage: 8,
      health: 50,
      loot: {
        "cured meat": { min: 1, max: 5, chance: 0.8 },
        bullets: { min: 1, max: 5, chance: 0.5 },
        rifle: { min: 1, max: 1, chance: 0.2 },
      },
    });
    expect(setpieceCombats["city-commando"]).toMatchObject({
      enemy: "commando",
      ranged: true,
      damage: 3,
      hit: 0.9,
      health: 55,
      loot: {
        rifle: { min: 1, max: 1, chance: 0.5 },
        bullets: { min: 1, max: 5, chance: 0.8 },
        "cured meat": { min: 1, max: 5, chance: 0.8 },
      },
    });
    expect(setpieceCombats["city-thug"]).toMatchObject({
      enemy: "thug",
      damage: 3,
      health: 30,
      loot: {
        "steel sword": { min: 1, max: 1, chance: 0.5 },
        "cured meat": { min: 1, max: 3, chance: 0.5 },
        cloth: { min: 1, max: 5, chance: 0.8 },
      },
    });
    expect(setpieceCombats["city-bird"]).toMatchObject({
      enemy: "bird",
      damage: 5,
      hit: 0.7,
      attackDelay: 1,
      health: 45,
      loot: {
        meat: { min: 5, max: 10, chance: 0.8 },
      },
    });
    expect(setpieceCombats["city-beast"]).toMatchObject({
      enemy: "beast",
      damage: 2,
      attackDelay: 1,
      health: 30,
      loot: {
        meat: { min: 1, max: 5, chance: 0.8 },
        fur: { min: 1, max: 5, chance: 0.8 },
        teeth: { min: 1, max: 5, chance: 0.5 },
      },
    });
    expect(setpieceCombats["city-old-man"]).toMatchObject({
      enemy: "old man",
      damage: 3,
      hit: 0.5,
      health: 10,
      loot: {
        "cured meat": { min: 1, max: 3, chance: 0.5 },
        cloth: { min: 1, max: 5, chance: 0.8 },
        medicine: { min: 1, max: 2, chance: 0.5 },
      },
    });
    expect(setpieceCombats["city-lizard"]).toMatchObject({
      enemy: "lizard",
      damage: 5,
      attackDelay: 2,
      health: 20,
      loot: {
        scales: { min: 5, max: 10, chance: 0.8 },
        teeth: { min: 5, max: 10, chance: 0.5 },
        meat: { min: 5, max: 10, chance: 0.8 },
      },
    });
    expect(setpieceCombats["city-lizards"]).toMatchObject({
      enemy: "lizards",
      damage: 4,
      attackDelay: 0.7,
      health: 30,
      loot: {
        meat: { min: 3, max: 8, chance: 1 },
        teeth: { min: 2, max: 4, chance: 1 },
        scales: { min: 3, max: 5, chance: 1 },
      },
    });
    expect(setpieceCombats["city-squatters"]).toMatchObject({
      enemy: "squatters",
      damage: 2,
      hit: 0.7,
      attackDelay: 0.5,
      health: 40,
      loot: {
        "cured meat": { min: 1, max: 3, chance: 0.5 },
        cloth: { min: 3, max: 8, chance: 0.8 },
        medicine: { min: 1, max: 3, chance: 0.3 },
      },
    });
    expect(setpieceCombats["city-crowd-squatters"]).toMatchObject({
      enemy: "squatters",
      damage: 2,
      hit: 0.7,
      attackDelay: 0.5,
      health: 40,
      loot: {
        cloth: { min: 1, max: 5, chance: 0.8 },
        teeth: { min: 1, max: 5, chance: 0.5 },
      },
    });
    expect(setpieceCombats["city-deformed"]).toMatchObject({
      enemy: "deformed",
      damage: 8,
      hit: 0.6,
      health: 40,
      loot: {
        cloth: { min: 1, max: 5, chance: 0.8 },
        teeth: { min: 2, max: 2, chance: 1 },
        steel: { min: 1, max: 3, chance: 0.6 },
        scales: { min: 2, max: 3, chance: 0.1 },
      },
    });
    expect(setpieceCombats["city-tentacles"]).toMatchObject({
      enemy: "tentacles",
      damage: 2,
      hit: 0.6,
      attackDelay: 0.5,
      health: 60,
      loot: {
        meat: { min: 10, max: 20, chance: 1 },
      },
    });
    expect(setpieceCombats["city-rats"]).toMatchObject({
      enemy: "rats",
      damage: 1,
      attackDelay: 0.25,
      health: 60,
      loot: {
        fur: { min: 5, max: 10, chance: 0.8 },
        teeth: { min: 5, max: 10, chance: 0.5 },
      },
    });
    expect(setpieceCombats["city-veteran"]).toMatchObject({
      enemy: "veteran",
      damage: 6,
      health: 45,
      loot: {
        bayonet: { min: 1, max: 1, chance: 0.5 },
        "cured meat": { min: 1, max: 5, chance: 0.8 },
      },
    });
    expect(setpieceCombats["city-frail-man"]).toMatchObject({
      enemy: "frail man",
      damage: 1,
      health: 10,
      loot: {
        "cured meat": { min: 1, max: 5, chance: 0.8 },
        cloth: { min: 1, max: 5, chance: 0.5 },
        leather: { min: 1, max: 1, chance: 0.2 },
        medicine: { min: 1, max: 3, chance: 0.05 },
      },
    });
    expect(setpieceCombats["city-youth"]).toMatchObject({
      enemy: "youth",
      damage: 2,
      health: 45,
      loot: {
        cloth: { min: 1, max: 5, chance: 0.8 },
        teeth: { min: 1, max: 5, chance: 0.5 },
      },
    });
    expect(setpieceCombats["city-squatter"]).toMatchObject({
      enemy: "squatter",
      damage: 3,
      health: 20,
      loot: {
        cloth: { min: 1, max: 5, chance: 0.8 },
        teeth: { min: 1, max: 5, chance: 0.5 },
      },
    });
    expect(setpieceCombats["sulphurmine-veteran"]).toMatchObject({
      enemy: "veteran",
      damage: 10,
      health: 65,
      loot: {
        bayonet: { min: 1, max: 1, chance: 0.5 },
        "cured meat": { min: 1, max: 5, chance: 0.8 },
      },
    });
    expect(setpieceCombats["coalmine-man"]).toMatchObject({
      enemy: "man",
      damage: 3,
      health: 10,
      loot: {
        "cured meat": { min: 1, max: 5, chance: 0.8 },
        cloth: { min: 1, max: 5, chance: 0.8 },
      },
    });
    expect(setpieceCombats["coalmine-chief"]).toMatchObject({
      enemy: "chief",
      damage: 5,
      health: 20,
      loot: {
        "cured meat": { min: 5, max: 10, chance: 1 },
        cloth: { min: 5, max: 10, chance: 0.8 },
        iron: { min: 1, max: 5, chance: 0.8 },
      },
    });
    expect(setpieceCombats["ironmine-matriarch"]).toMatchObject({
      enemy: "beastly matriarch",
      damage: 4,
      health: 10,
      loot: {
        teeth: { min: 5, max: 10, chance: 1 },
        scales: { min: 5, max: 10, chance: 0.8 },
        cloth: { min: 5, max: 10, chance: 0.5 },
      },
    });
    const setpieceEvents = originalEventDefinitions.filter(
      (entry) => entry.pool === "setpiece",
    );
    expect(setpieceEvents).toHaveLength(49);
    expect(setpieceEvents.map((entry) => entry.key)).toEqual([
      "setpiece.outpost",
      "setpiece.swamp",
      "setpiece.old-house",
      "setpiece.borehole",
      "setpiece.battlefield",
      "setpiece.crashed-ship",
      "setpiece.destroyed-village",
      "setpiece.cave-depths",
      "setpiece.cave-camp-cache",
      "setpiece.cave-wanderer-nest",
      "setpiece.cave-old-case",
      "setpiece.town-thug",
      "setpiece.town-schoolhouse",
      "setpiece.town-park-vigilante",
      "setpiece.town-caravan-vigilante",
      "setpiece.town-clinic",
      "setpiece.town-clinic-madman",
      "setpiece.city-old-tower",
      "setpiece.city-old-tower-scavenged",
      "setpiece.city-old-tower-thug-rubble",
      "setpiece.city-old-tower-rubble",
      "setpiece.city-sniper",
      "setpiece.city-hospital",
      "setpiece.city-soldier-patrol",
      "setpiece.city-commando-settlement",
      "setpiece.city-subway",
      "setpiece.city-subway-beast-rubble",
      "setpiece.city-commando-supplies",
      "setpiece.city-military-camp",
      "setpiece.city-military-camp-supplies",
      "setpiece.city-subway-scavenged",
      "setpiece.city-shanty-market",
      "setpiece.city-drying-hut",
      "setpiece.city-drying-hut-sack",
      "setpiece.city-shanty-crowd",
      "setpiece.city-shanty-crowd-sack",
      "setpiece.city-drying-meat-youth",
      "setpiece.city-shanty-crowd-youth",
      "setpiece.city-hospital-medicine",
      "setpiece.city-hospital-cache",
      "setpiece.city-hospital-old-man-theatres",
      "setpiece.city-hospital-old-man-squatters",
      "setpiece.city-hospital-ward",
      "setpiece.city-hospital-squatters",
      "setpiece.city-hospital-deformed",
      "setpiece.city-hospital-tentacles",
      "setpiece.sulphurmine",
      "setpiece.coalmine",
      "setpiece.ironmine",
    ]);
    expect(setpieceEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "setpiece.outpost",
          title: "An Outpost",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: ["a safe place in the wilds."],
              notification: "a safe place in the wilds.",
              loot: {
                "cured meat": { min: 5, max: 10, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.swamp",
          title: "A Murky Swamp",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              notification: "a swamp festers in the stagnant air.",
            }),
            cabin: expect.objectContaining({
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "talk",
                  cost: { charm: 1 },
                }),
              ]),
            }),
            talk: expect.objectContaining({
              text: expect.arrayContaining([
                "the wanderer takes the charm and nods slowly.",
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.cave-depths",
          title: "A Damp Cave",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              notification:
                "the earth here is split, as if bearing an ancient wound",
            }),
            beast: expect.objectContaining({
              notification: "a startled beast defends its home",
              combat: expect.objectContaining({
                enemy: "beast",
              }),
            }),
            lizard: expect.objectContaining({
              notification: "a cave lizard attacks",
              combat: expect.objectContaining({
                enemy: "cave lizard",
              }),
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.cave-camp-cache",
          title: "A Damp Cave",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "enter",
                  cost: { torch: 1 },
                }),
              ]),
            }),
            camp: expect.objectContaining({
              text: [
                "the remains of an old camp sits just inside the cave.",
                "bedrolls, torn and blackened, lay beneath a thin layer of dust.",
              ],
              loot: {
                "cured meat": { min: 1, max: 5, chance: 1 },
                torch: { min: 1, max: 5, chance: 0.5 },
                leather: { min: 1, max: 5, chance: 0.3 },
              },
            }),
            lizard: expect.objectContaining({
              notification: "a giant lizard shambles forward",
              combat: expect.objectContaining({
                enemy: "lizard",
                health: 10,
              }),
            }),
            "supply-cache": expect.objectContaining({
              text: ["a small supply cache is hidden at the back of the cave."],
              loot: {
                cloth: { min: 5, max: 10, chance: 1 },
                leather: { min: 5, max: 10, chance: 1 },
                iron: { min: 5, max: 10, chance: 1 },
                "cured meat": { min: 5, max: 10, chance: 1 },
                steel: { min: 5, max: 10, chance: 0.5 },
                bolas: { min: 1, max: 3, chance: 0.3 },
                medicine: { min: 1, max: 4, chance: 0.15 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.cave-wanderer-nest",
          title: "A Damp Cave",
          scenes: expect.objectContaining({
            beast: expect.objectContaining({
              notification: "a startled beast defends its home",
              combat: expect.objectContaining({
                enemy: "beast",
              }),
            }),
            "wanderer-body": expect.objectContaining({
              text: [
                "the body of a wanderer lies in a small cavern.",
                "rot's been to work on it, and some of the pieces are missing.",
                "can't tell what left it here.",
              ],
              loot: {
                "iron sword": { min: 1, max: 1, chance: 1 },
                "cured meat": { min: 1, max: 5, chance: 0.8 },
                torch: { min: 1, max: 3, chance: 0.5 },
                medicine: { min: 1, max: 2, chance: 0.1 },
              },
            }),
            "large-beast": expect.objectContaining({
              notification: "a large beast charges out of the dark",
              combat: expect.objectContaining({
                enemy: "beast",
                health: 10,
              }),
            }),
            nest: expect.objectContaining({
              text: [
                "the nest of a large animal lies at the back of the cave.",
              ],
              loot: {
                meat: { min: 5, max: 10, chance: 1 },
                fur: { min: 5, max: 10, chance: 1 },
                scales: { min: 5, max: 10, chance: 1 },
                teeth: { min: 5, max: 10, chance: 1 },
                cloth: { min: 5, max: 10, chance: 0.5 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.cave-old-case",
          title: "A Damp Cave",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "enter",
                  cost: { torch: 1 },
                }),
              ]),
            }),
            narrow: expect.objectContaining({
              text: [
                "the cave narrows a few feet in.",
                "the walls are moist and moss-covered",
              ],
            }),
            beast: expect.objectContaining({
              notification: "a startled beast defends its home",
              combat: expect.objectContaining({
                enemy: "beast",
                loot: {
                  fur: { min: 1, max: 3, chance: 1 },
                  teeth: { min: 1, max: 2, chance: 0.8 },
                },
              }),
            }),
            lizard: expect.objectContaining({
              notification: "a giant lizard shambles forward",
              combat: expect.objectContaining({
                enemy: "lizard",
                health: 10,
              }),
            }),
            "old-case": expect.objectContaining({
              text: [
                "an old case is wedged behind a rock, covered in a thick layer of dust.",
              ],
              loot: {
                "steel sword": { min: 1, max: 1, chance: 1 },
                bolas: { min: 1, max: 3, chance: 0.5 },
                medicine: { min: 1, max: 3, chance: 0.3 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.old-house",
          title: "An Old House",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              notification:
                "the remains of an old house stand as a monument to simpler times",
            }),
            medicine: expect.objectContaining({
              text: [
                "the house has been ransacked.",
                "but there is a cache of medicine under the floorboards.",
              ],
              loot: {
                medicine: { min: 2, max: 5, chance: 1 },
              },
            }),
            supplies: expect.objectContaining({
              text: [
                "the house is abandoned, but not yet picked over.",
                "still a few drops of water in the old well.",
              ],
              loot: {
                "cured meat": { min: 1, max: 10, chance: 0.8 },
                leather: { min: 1, max: 10, chance: 0.2 },
                cloth: { min: 1, max: 10, chance: 0.5 },
              },
            }),
            occupied: expect.objectContaining({
              notification:
                "a man charges down the hall, a rusty blade in his hand",
              combat: expect.objectContaining({
                enemy: "squatter",
              }),
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.borehole",
          title: "A Huge Borehole",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "a huge hole is cut deep into the earth, evidence of the past harvest.",
                "they took what they came for, and left.",
                "castoff from the mammoth drills can still be found by the edges of the precipice.",
              ],
              loot: {
                "alien alloy": { min: 1, max: 3, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.battlefield",
          title: "A Forgotten Battlefield",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "a battle was fought here, long ago.",
                "battered technology from both sides lays dormant on the blasted landscape.",
              ],
              loot: {
                rifle: { min: 1, max: 3, chance: 0.5 },
                bullets: { min: 5, max: 20, chance: 0.8 },
                "laser rifle": { min: 1, max: 3, chance: 0.3 },
                "energy cell": { min: 5, max: 10, chance: 0.5 },
                grenade: { min: 1, max: 5, chance: 0.5 },
                "alien alloy": { min: 1, max: 1, chance: 0.3 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.crashed-ship",
          title: "A Crashed Ship",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "the familiar curves of a wanderer vessel rise up out of the dust and ash. ",
                "lucky that the natives can't work the mechanisms.",
                "with a little effort, it might fly again.",
              ],
              buttons: [
                {
                  key: "leavel",
                  text: "salvage",
                  nextScene: "end",
                },
              ],
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.destroyed-village",
          title: "A Destroyed Village",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "a destroyed village lies in the dust.",
                "charred bodies litter the ground.",
              ],
              notification:
                "the metallic tang of wanderer afterburner hangs in the air.",
            }),
            underground: expect.objectContaining({
              text: [
                "a shack stands at the center of the village.",
                "there are still supplies inside.",
              ],
            }),
            exit: expect.objectContaining({
              text: [
                "all the work of a previous generation is here.",
                "ripe for the picking.",
              ],
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.town-thug",
          title: "A Deserted Town",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              notification: "the town lies abandoned, its citizens long dead",
            }),
            ambush: expect.objectContaining({
              notification: "ambushed on the street.",
              combat: expect.objectContaining({
                enemy: "thug",
              }),
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.town-schoolhouse",
          title: "A Deserted Town",
          scenes: expect.objectContaining({
            schoolhouse: expect.objectContaining({
              text: [
                "where the windows of the schoolhouse aren't shattered, they're blackened with soot.",
                "the double doors creak endlessly in the wind.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "enter",
                  cost: { torch: 1 },
                }),
              ]),
            }),
            locker: expect.objectContaining({
              text: [
                "a small cache of supplies is tucked inside a rusting locker.",
              ],
              loot: {
                "cured meat": { min: 1, max: 5, chance: 1 },
                torch: { min: 1, max: 3, chance: 0.8 },
                bullets: { min: 1, max: 5, chance: 0.3 },
                medicine: { min: 1, max: 3, chance: 0.05 },
              },
            }),
            thug: expect.objectContaining({
              notification: "a thug moves out of the shadows.",
              combat: expect.objectContaining({
                enemy: "thug",
              }),
            }),
            scavenger: expect.objectContaining({
              notification:
                "a panicked scavenger bursts through the door, screaming.",
              combat: expect.objectContaining({
                enemy: "scavenger",
              }),
            }),
            camp: expect.objectContaining({
              text: [
                "scavenger had a small camp in the school.",
                "collected scraps spread across the floor like they fell from heaven.",
              ],
              loot: {
                "steel sword": { min: 1, max: 1, chance: 1 },
                steel: { min: 5, max: 10, chance: 1 },
                "cured meat": { min: 5, max: 10, chance: 1 },
                bolas: { min: 1, max: 5, chance: 0.5 },
                medicine: { min: 1, max: 2, chance: 0.3 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.town-park-vigilante",
          title: "A Deserted Town",
          scenes: expect.objectContaining({
            ambush: expect.objectContaining({
              notification: "ambushed on the street.",
              combat: expect.objectContaining({
                enemy: "thug",
              }),
            }),
            park: expect.objectContaining({
              notification: "a beast stands alone in an overgrown park.",
              combat: expect.objectContaining({
                enemy: "beast",
                health: 25,
              }),
            }),
            commotion: expect.objectContaining({
              text: [
                "something's causing a commotion a ways down the road.",
                "a fight, maybe.",
              ],
            }),
            vigilante: expect.objectContaining({
              notification:
                "a man stands over a dead wanderer. notices he's not alone.",
              combat: expect.objectContaining({
                enemy: "vigilante",
              }),
            }),
            "wanderer-rifle": expect.objectContaining({
              text: [
                "beneath the wanderer's rags, clutched in one of its many hands, a glint of steel.",
                "worth killing for, it seems.",
              ],
              loot: {
                rifle: { min: 1, max: 1, chance: 1 },
                bullets: { min: 1, max: 5, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.town-caravan-vigilante",
          title: "A Deserted Town",
          scenes: expect.objectContaining({
            ambush: expect.objectContaining({
              notification: "ambushed on the street.",
              combat: expect.objectContaining({
                enemy: "thug",
              }),
            }),
            caravan: expect.objectContaining({
              text: [
                "an overturned caravan is spread across the pockmarked street.",
                "it's been picked over by scavengers, but there's still some things worth taking.",
              ],
              loot: {
                "cured meat": { min: 1, max: 5, chance: 0.8 },
                torch: { min: 1, max: 3, chance: 0.5 },
                bullets: { min: 1, max: 5, chance: 0.3 },
                medicine: { min: 1, max: 3, chance: 0.1 },
              },
            }),
            "food-basket": expect.objectContaining({
              text: [
                "a small basket of food is hidden under a park bench, with a note attached.",
                "can't read the words.",
              ],
              loot: {
                "cured meat": { min: 1, max: 5, chance: 1 },
              },
            }),
            vigilante: expect.objectContaining({
              notification:
                "a man stands over a dead wanderer. notices he's not alone.",
              combat: expect.objectContaining({
                enemy: "vigilante",
              }),
            }),
            trinkets: expect.objectContaining({
              text: [
                "eye for an eye seems fair.",
                "always worked before, at least.",
                "picking the bones finds some useful trinkets.",
              ],
              loot: {
                "cured meat": { min: 5, max: 10, chance: 1 },
                iron: { min: 5, max: 10, chance: 1 },
                torch: { min: 1, max: 5, chance: 1 },
                bolas: { min: 1, max: 5, chance: 0.5 },
                medicine: { min: 1, max: 2, chance: 0.1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.town-clinic",
          title: "A Deserted Town",
          scenes: expect.objectContaining({
            clinic: expect.objectContaining({
              text: [
                "a squat building up ahead.",
                "a green cross barely visible behind grimy windows.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "enter",
                  cost: { torch: 1 },
                }),
              ]),
            }),
            medicine: expect.objectContaining({
              text: ["some medicine abandoned in the drawers."],
              loot: {
                medicine: { min: 2, max: 5, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.town-clinic-madman",
          title: "A Deserted Town",
          scenes: expect.objectContaining({
            clinic: expect.objectContaining({
              text: [
                "a squat building up ahead.",
                "a green cross barely visible behind grimy windows.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "enter",
                  cost: { torch: 1 },
                }),
              ]),
            }),
            madman: expect.objectContaining({
              notification: "a madman attacks, screeching.",
              combat: expect.objectContaining({
                enemy: "madman",
                hit: 0.3,
              }),
            }),
            ransacked: expect.objectContaining({
              text: [
                "the clinic has been ransacked.",
                "only dust and stains remain.",
              ],
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-old-tower",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "empty-streets": expect.objectContaining({
              text: [
                "the streets are empty.",
                "the air is filled with dust, driven relentlessly by the hard winds.",
              ],
            }),
            tower: expect.objectContaining({
              text: [
                "the old tower seems mostly intact.",
                "the shell of a burned out car blocks the entrance.",
                "most of the windows at ground level are busted anyway.",
              ],
            }),
            thug: expect.objectContaining({
              notification: "a thug is waiting on the other side of the wall.",
              combat: expect.objectContaining({
                enemy: "thug",
                health: 30,
              }),
            }),
            bird: expect.objectContaining({
              notification: "a large bird nests at the top of the stairs.",
              combat: expect.objectContaining({
                enemy: "bird",
                health: 45,
              }),
            }),
            nest: expect.objectContaining({
              text: [
                "bird must have liked shiney things.",
                "some good stuff woven into its nest.",
              ],
              loot: {
                bullets: { min: 5, max: 10, chance: 0.8 },
                bolas: { min: 1, max: 5, chance: 0.5 },
                "alien alloy": { min: 1, max: 1, chance: 0.5 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-old-tower-scavenged",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            tower: expect.objectContaining({
              text: [
                "the old tower seems mostly intact.",
                "the shell of a burned out car blocks the entrance.",
                "most of the windows at ground level are busted anyway.",
              ],
            }),
            thug: expect.objectContaining({
              notification: "a thug is waiting on the other side of the wall.",
              combat: expect.objectContaining({
                enemy: "thug",
                health: 30,
              }),
            }),
            bird: expect.objectContaining({
              notification: "a large bird nests at the top of the stairs.",
              combat: expect.objectContaining({
                enemy: "bird",
                health: 45,
              }),
            }),
            scavenged: expect.objectContaining({
              text: [
                "not much here.",
                "scavengers must have gotten to this place already.",
              ],
              loot: {
                torch: { min: 1, max: 5, chance: 0.8 },
                "cured meat": { min: 1, max: 5, chance: 0.5 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-old-tower-thug-rubble",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            tower: expect.objectContaining({
              text: [
                "the old tower seems mostly intact.",
                "the shell of a burned out car blocks the entrance.",
                "most of the windows at ground level are busted anyway.",
              ],
            }),
            thug: expect.objectContaining({
              notification: "a thug is waiting on the other side of the wall.",
              combat: expect.objectContaining({
                enemy: "thug",
              }),
            }),
            rubble: expect.objectContaining({
              text: [
                "the debris is denser here.",
                "maybe some useful stuff in the rubble.",
              ],
              loot: {
                bullets: { min: 1, max: 5, chance: 0.5 },
                steel: { min: 1, max: 10, chance: 0.8 },
                "alien alloy": { min: 1, max: 1, chance: 0.01 },
                cloth: { min: 1, max: 10, chance: 1 },
              },
            }),
            scavenged: expect.objectContaining({
              text: [
                "not much here.",
                "scavengers must have gotten to this place already.",
              ],
              loot: {
                torch: { min: 1, max: 5, chance: 0.8 },
                "cured meat": { min: 1, max: 5, chance: 0.5 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-old-tower-rubble",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "empty-streets": expect.objectContaining({
              text: [
                "the streets are empty.",
                "the air is filled with dust, driven relentlessly by the hard winds.",
              ],
            }),
            tower: expect.objectContaining({
              text: [
                "the old tower seems mostly intact.",
                "the shell of a burned out car blocks the entrance.",
                "most of the windows at ground level are busted anyway.",
              ],
            }),
            beast: expect.objectContaining({
              notification: "a snarling beast jumps out from behind a car.",
              combat: expect.objectContaining({
                enemy: "beast",
                health: 30,
              }),
            }),
            rubble: expect.objectContaining({
              text: [
                "the debris is denser here.",
                "maybe some useful stuff in the rubble.",
              ],
              loot: {
                bullets: { min: 1, max: 5, chance: 0.5 },
                steel: { min: 1, max: 10, chance: 0.8 },
                "alien alloy": { min: 1, max: 1, chance: 0.01 },
                cloth: { min: 1, max: 10, chance: 1 },
              },
            }),
            scavenged: expect.objectContaining({
              text: [
                "not much here.",
                "scavengers must have gotten to this place already.",
              ],
              loot: {
                torch: { min: 1, max: 5, chance: 0.8 },
                "cured meat": { min: 1, max: 5, chance: 0.5 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-sniper",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              notification:
                "the towers of a decaying city dominate the skyline",
            }),
            sniper: expect.objectContaining({
              notification: "the shot echoes in the empty street.",
              combat: expect.objectContaining({
                enemy: "sniper",
                ranged: true,
              }),
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-hospital",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            hospital: expect.objectContaining({
              text: ["the shell of an abandoned hospital looms ahead."],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "enter",
                  cost: { torch: 1 },
                }),
              ]),
            }),
            "operating-theatre": expect.objectContaining({
              text: [
                "someone has locked and barricaded the door to this operating theatre.",
              ],
            }),
            stockpile: expect.objectContaining({
              text: ["someone had been stockpiling loot here."],
              loot: {
                "energy cell": { min: 1, max: 3, chance: 0.2 },
                medicine: { min: 3, max: 10, chance: 0.5 },
                bullets: { min: 2, max: 8, chance: 1 },
                torch: { min: 1, max: 3, chance: 0.5 },
                grenade: { min: 1, max: 1, chance: 0.5 },
                "alien alloy": { min: 1, max: 2, chance: 0.8 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-soldier-patrol",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            checkpoint: expect.objectContaining({
              text: [
                "orange traffic cones are set across the street, faded and cracked.",
                "lights flash through the alleys between buildings.",
              ],
            }),
            soldier: expect.objectContaining({
              notification:
                "the soldier steps out from between the buildings, rifle raised.",
              combat: expect.objectContaining({
                enemy: "soldier",
                ranged: true,
              }),
            }),
            voices: expect.objectContaining({
              text: [
                "more voices can be heard ahead.",
                "they must be here for a reason.",
              ],
            }),
            "second-soldier": expect.objectContaining({
              notification: "a second soldier opens fire.",
              combat: expect.objectContaining({
                enemy: "soldier",
                ranged: true,
              }),
            }),
            supplies: expect.objectContaining({
              text: [
                "searching the bodies yields a few supplies.",
                "more soldiers will be on their way.",
                "time to move on.",
              ],
              loot: {
                rifle: { min: 1, max: 1, chance: 1 },
                bullets: { min: 1, max: 10, chance: 1 },
                "cured meat": { min: 1, max: 5, chance: 0.8 },
                medicine: { min: 1, max: 4, chance: 0.1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-commando-settlement",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            soldier: expect.objectContaining({
              notification:
                "the soldier steps out from between the buildings, rifle raised.",
              combat: expect.objectContaining({
                enemy: "soldier",
                ranged: true,
              }),
            }),
            gunfire: expect.objectContaining({
              text: [
                "the sound of gunfire carries on the wind.",
                "the street ahead glows with firelight.",
              ],
            }),
            commando: expect.objectContaining({
              notification: "a masked soldier rounds the corner, gun drawn",
              combat: expect.objectContaining({
                enemy: "commando",
                ranged: true,
                health: 55,
              }),
            }),
            "burning-settlement": expect.objectContaining({
              text: [
                "the small settlement has clearly been burning a while.",
                "the bodies of the wanderers that lived here are still visible in the flames.",
                "still time to rescue a few supplies.",
              ],
              loot: {
                "laser rifle": { min: 1, max: 1, chance: 0.5 },
                "energy cell": { min: 1, max: 5, chance: 0.5 },
                "cured meat": { min: 1, max: 10, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-commando-supplies",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            soldier: expect.objectContaining({
              notification:
                "the soldier steps out from between the buildings, rifle raised.",
              combat: expect.objectContaining({
                enemy: "soldier",
                ranged: true,
              }),
            }),
            gunfire: expect.objectContaining({
              text: [
                "the sound of gunfire carries on the wind.",
                "the street ahead glows with firelight.",
              ],
            }),
            commando: expect.objectContaining({
              notification: "a masked soldier rounds the corner, gun drawn",
              combat: expect.objectContaining({
                enemy: "commando",
                ranged: true,
                health: 55,
              }),
            }),
            supplies: expect.objectContaining({
              text: [
                "searching the bodies yields a few supplies.",
                "more soldiers will be on their way.",
                "time to move on.",
              ],
              loot: {
                rifle: { min: 1, max: 1, chance: 1 },
                bullets: { min: 1, max: 10, chance: 1 },
                "cured meat": { min: 1, max: 5, chance: 0.8 },
                medicine: { min: 1, max: 4, chance: 0.1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-subway",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "empty-streets": expect.objectContaining({
              text: [
                "the streets are empty.",
                "the air is filled with dust, driven relentlessly by the hard winds.",
              ],
            }),
            lizard: expect.objectContaining({
              notification:
                "a huge lizard scrambles up out of the darkness of an old metro station.",
              combat: expect.objectContaining({
                enemy: "lizard",
              }),
            }),
            "subway-platform": expect.objectContaining({
              text: [
                "street above the subway platform is blown away.",
                "lets some light down into the dusty haze.",
                "a sound comes from the tunnel, just ahead.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "enter",
                  cost: { torch: 1 },
                }),
              ]),
            }),
            rats: expect.objectContaining({
              notification: "a swarm of rats rushes up the tunnel.",
              combat: expect.objectContaining({
                enemy: "rats",
                attackDelay: 0.25,
              }),
            }),
            "battle-platform": expect.objectContaining({
              text: [
                "the tunnel opens up at another platform.",
                "the walls are scorched from an old battle.",
                "bodies and supplies from both sides litter the ground.",
              ],
              loot: {
                rifle: { min: 1, max: 1, chance: 0.8 },
                bullets: { min: 1, max: 5, chance: 0.8 },
                "laser rifle": { min: 1, max: 1, chance: 0.3 },
                "energy cell": { min: 1, max: 5, chance: 0.3 },
                "alien alloy": { min: 1, max: 1, chance: 0.3 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-subway-beast-rubble",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            lizard: expect.objectContaining({
              notification:
                "a huge lizard scrambles up out of the darkness of an old metro station.",
              combat: expect.objectContaining({
                enemy: "lizard",
                health: 20,
              }),
            }),
            beast: expect.objectContaining({
              notification: "a snarling beast jumps out from behind a car.",
              combat: expect.objectContaining({
                enemy: "beast",
                health: 30,
              }),
            }),
            rubble: expect.objectContaining({
              text: [
                "the debris is denser here.",
                "maybe some useful stuff in the rubble.",
              ],
              loot: {
                bullets: { min: 1, max: 5, chance: 0.5 },
                steel: { min: 1, max: 10, chance: 0.8 },
                "alien alloy": { min: 1, max: 1, chance: 0.01 },
                cloth: { min: 1, max: 10, chance: 1 },
              },
            }),
            scavenged: expect.objectContaining({
              text: [
                "not much here.",
                "scavengers must have gotten to this place already.",
              ],
              loot: {
                torch: { min: 1, max: 5, chance: 0.8 },
                "cured meat": { min: 1, max: 5, chance: 0.5 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-subway-scavenged",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            lizard: expect.objectContaining({
              notification:
                "a huge lizard scrambles up out of the darkness of an old metro station.",
              combat: expect.objectContaining({
                enemy: "lizard",
                health: 20,
              }),
            }),
            "subway-platform": expect.objectContaining({
              text: [
                "street above the subway platform is blown away.",
                "lets some light down into the dusty haze.",
                "a sound comes from the tunnel, just ahead.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "enter",
                  cost: { torch: 1 },
                }),
              ]),
            }),
            rats: expect.objectContaining({
              notification: "a swarm of rats rushes up the tunnel.",
              combat: expect.objectContaining({
                enemy: "rats",
                attackDelay: 0.25,
              }),
            }),
            scavenged: expect.objectContaining({
              text: [
                "not much here.",
                "scavengers must have gotten to this place already.",
              ],
              loot: {
                torch: { min: 1, max: 5, chance: 0.8 },
                "cured meat": { min: 1, max: 5, chance: 0.5 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-military-camp",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            checkpoint: expect.objectContaining({
              text: [
                "orange traffic cones are set across the street, faded and cracked.",
                "lights flash through the alleys between buildings.",
              ],
            }),
            sniper: expect.objectContaining({
              notification: "the shot echoes in the empty street.",
              combat: expect.objectContaining({
                enemy: "sniper",
                ranged: true,
              }),
            }),
            camp: expect.objectContaining({
              text: [
                "looks like a camp of sorts up ahead.",
                "rusted chainlink is pulled across an alleyway.",
                "fires burn in the courtyard beyond.",
              ],
            }),
            veteran: expect.objectContaining({
              notification: "a large man attacks, waving a bayonet.",
              combat: expect.objectContaining({
                enemy: "veteran",
                damage: 6,
              }),
            }),
            outpost: expect.objectContaining({
              text: [
                "the small military outpost is well supplied.",
                "arms and munitions, relics from the war, are neatly arranged on the store-room floor.",
                "just as deadly now as they were then.",
              ],
              loot: {
                rifle: { min: 1, max: 1, chance: 1 },
                bullets: { min: 1, max: 10, chance: 1 },
                grenade: { min: 1, max: 5, chance: 0.8 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-military-camp-supplies",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            sniper: expect.objectContaining({
              notification: "the shot echoes in the empty street.",
              combat: expect.objectContaining({
                enemy: "sniper",
                ranged: true,
              }),
            }),
            camp: expect.objectContaining({
              text: [
                "looks like a camp of sorts up ahead.",
                "rusted chainlink is pulled across an alleyway.",
                "fires burn in the courtyard beyond.",
              ],
            }),
            veteran: expect.objectContaining({
              notification: "a large man attacks, waving a bayonet.",
              combat: expect.objectContaining({
                enemy: "veteran",
                damage: 6,
              }),
            }),
            supplies: expect.objectContaining({
              text: [
                "searching the bodies yields a few supplies.",
                "more soldiers will be on their way.",
                "time to move on.",
              ],
              loot: {
                rifle: { min: 1, max: 1, chance: 1 },
                bullets: { min: 1, max: 10, chance: 1 },
                "cured meat": { min: 1, max: 5, chance: 0.8 },
                medicine: { min: 1, max: 4, chance: 0.1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-shanty-market",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "shanty-town": expect.objectContaining({
              text: [
                "a large shanty town sprawls across the streets.",
                "faces, darkened by soot and blood, stare out from crooked huts.",
              ],
            }),
            "frail-man": expect.objectContaining({
              notification: "a frail man stands defiantly, blocking the path.",
              combat: expect.objectContaining({
                enemy: "frail man",
              }),
            }),
            shop: expect.objectContaining({
              text: [
                "an improvised shop is set up on the sidewalk.",
                "the owner stands by, stoic.",
              ],
              loot: {
                "steel sword": { min: 1, max: 1, chance: 0.8 },
                rifle: { min: 1, max: 1, chance: 0.5 },
                bullets: { min: 1, max: 8, chance: 0.25 },
                "alien alloy": { min: 1, max: 1, chance: 0.01 },
                medicine: { min: 1, max: 4, chance: 0.5 },
              },
            }),
            youth: expect.objectContaining({
              notification: "a youth lashes out with a tree branch.",
              combat: expect.objectContaining({
                enemy: "youth",
              }),
            }),
            "canvas-sack": expect.objectContaining({
              text: [
                "the young settler was carrying a canvas sack.",
                "it contains travelling gear, and a few trinkets.",
                "there's nothing else here.",
              ],
              loot: {
                "steel sword": { min: 1, max: 1, chance: 0.8 },
                bolas: { min: 1, max: 5, chance: 0.5 },
                "cured meat": { min: 1, max: 10, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-shanty-crowd",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "frail-man": expect.objectContaining({
              notification: "a frail man stands defiantly, blocking the path.",
              combat: expect.objectContaining({
                enemy: "frail man",
              }),
            }),
            crowd: expect.objectContaining({
              text: [
                "more squatters are crowding around now.",
                "someone throws a stone.",
              ],
            }),
            squatters: expect.objectContaining({
              notification: "the crowd surges forward.",
              combat: expect.objectContaining({
                enemy: "squatters",
                attackDelay: 0.5,
              }),
            }),
            belongings: expect.objectContaining({
              text: [
                "the remaining settlers flee from the violence, their belongings forgotten.",
                "there's not much, but some useful things can still be found.",
              ],
              loot: {
                "steel sword": { min: 1, max: 1, chance: 0.8 },
                "energy cell": { min: 1, max: 5, chance: 0.5 },
                "cured meat": { min: 1, max: 10, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-shanty-crowd-sack",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "frail-man": expect.objectContaining({
              notification: "a frail man stands defiantly, blocking the path.",
              combat: expect.objectContaining({
                enemy: "frail man",
              }),
            }),
            crowd: expect.objectContaining({
              text: [
                "more squatters are crowding around now.",
                "someone throws a stone.",
              ],
            }),
            squatters: expect.objectContaining({
              notification: "the crowd surges forward.",
              combat: expect.objectContaining({
                enemy: "squatters",
                attackDelay: 0.5,
              }),
            }),
            "canvas-sack": expect.objectContaining({
              text: [
                "the young settler was carrying a canvas sack.",
                "it contains travelling gear, and a few trinkets.",
                "there's nothing else here.",
              ],
              loot: {
                "steel sword": { min: 1, max: 1, chance: 0.8 },
                bolas: { min: 1, max: 5, chance: 0.5 },
                "cured meat": { min: 1, max: 10, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-drying-meat-youth",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "broken-people": expect.objectContaining({
              text: [
                "nothing but downcast eyes.",
                "the people here were broken a long time ago.",
              ],
            }),
            "drying-meat": expect.objectContaining({
              text: [
                "strips of meat hang drying by the side of the street.",
                "the people back away, avoiding eye contact.",
              ],
              loot: {
                "cured meat": { min: 5, max: 10, chance: 1 },
              },
            }),
            youth: expect.objectContaining({
              notification: "a youth lashes out with a tree branch.",
              combat: expect.objectContaining({
                enemy: "youth",
                health: 45,
              }),
            }),
            "canvas-sack": expect.objectContaining({
              text: [
                "the young settler was carrying a canvas sack.",
                "it contains travelling gear, and a few trinkets.",
                "there's nothing else here.",
              ],
              loot: {
                "steel sword": { min: 1, max: 1, chance: 0.8 },
                bolas: { min: 1, max: 5, chance: 0.5 },
                "cured meat": { min: 1, max: 10, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-shanty-crowd-youth",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            crowd: expect.objectContaining({
              text: [
                "more squatters are crowding around now.",
                "someone throws a stone.",
              ],
            }),
            youth: expect.objectContaining({
              notification: "a youth lashes out with a tree branch.",
              combat: expect.objectContaining({
                enemy: "youth",
                health: 45,
              }),
            }),
            "canvas-sack": expect.objectContaining({
              text: [
                "the young settler was carrying a canvas sack.",
                "it contains travelling gear, and a few trinkets.",
                "there's nothing else here.",
              ],
              loot: {
                "steel sword": { min: 1, max: 1, chance: 0.8 },
                bolas: { min: 1, max: 5, chance: 0.5 },
                "cured meat": { min: 1, max: 10, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-drying-hut",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "broken-people": expect.objectContaining({
              text: [
                "nothing but downcast eyes.",
                "the people here were broken a long time ago.",
              ],
            }),
            "drying-meat": expect.objectContaining({
              text: [
                "strips of meat hang drying by the side of the street.",
                "the people back away, avoiding eye contact.",
              ],
              loot: {
                "cured meat": { min: 5, max: 10, chance: 1 },
              },
            }),
            squatter: expect.objectContaining({
              notification:
                "a squatter stands firmly in the doorway of a small hut.",
              combat: expect.objectContaining({
                enemy: "squatter",
                health: 20,
              }),
            }),
            hut: expect.objectContaining({
              text: [
                "inside the hut, a child cries.",
                "a few belongings rest against the walls.",
                "there's nothing else here.",
              ],
              loot: {
                rifle: { min: 1, max: 1, chance: 0.8 },
                bullets: { min: 1, max: 5, chance: 0.8 },
                bolas: { min: 1, max: 5, chance: 0.5 },
                "alien alloy": { min: 1, max: 1, chance: 0.2 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-drying-hut-sack",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "broken-people": expect.objectContaining({
              text: [
                "nothing but downcast eyes.",
                "the people here were broken a long time ago.",
              ],
            }),
            "drying-meat": expect.objectContaining({
              text: [
                "strips of meat hang drying by the side of the street.",
                "the people back away, avoiding eye contact.",
              ],
              loot: {
                "cured meat": { min: 5, max: 10, chance: 1 },
              },
            }),
            squatter: expect.objectContaining({
              notification:
                "a squatter stands firmly in the doorway of a small hut.",
              combat: expect.objectContaining({
                enemy: "squatter",
                health: 20,
              }),
            }),
            "canvas-sack": expect.objectContaining({
              text: [
                "the young settler was carrying a canvas sack.",
                "it contains travelling gear, and a few trinkets.",
                "there's nothing else here.",
              ],
              loot: {
                "steel sword": { min: 1, max: 1, chance: 0.8 },
                bolas: { min: 1, max: 5, chance: 0.5 },
                "cured meat": { min: 1, max: 10, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-hospital-medicine",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "old-man": expect.objectContaining({
              notification:
                "an old man bursts through a door, wielding a scalpel.",
              combat: expect.objectContaining({
                enemy: "old man",
                hit: 0.5,
              }),
            }),
            "dried-meat": expect.objectContaining({
              text: ["strips of meat are hung up to dry in this ward."],
              loot: {
                "cured meat": { min: 3, max: 10, chance: 1 },
              },
            }),
            "medicine-cabinet": expect.objectContaining({
              text: [
                "a pristine medicine cabinet at the end of a hallway.",
                "the rest of the hospital is empty.",
              ],
              loot: {
                "energy cell": { min: 1, max: 1, chance: 0.2 },
                medicine: { min: 3, max: 10, chance: 1 },
                teeth: { min: 1, max: 2, chance: 0.2 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-hospital-cache",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "old-man": expect.objectContaining({
              notification:
                "an old man bursts through a door, wielding a scalpel.",
              combat: expect.objectContaining({
                enemy: "old man",
                hit: 0.5,
              }),
            }),
            cache: expect.objectContaining({
              text: ["the old man had a small cache of interesting items."],
              loot: {
                "alien alloy": { min: 1, max: 1, chance: 0.8 },
                medicine: { min: 1, max: 4, chance: 1 },
                "cured meat": { min: 3, max: 7, chance: 1 },
                bolas: { min: 1, max: 3, chance: 0.5 },
                fur: { min: 1, max: 5, chance: 0.8 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-hospital-old-man-theatres",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "old-man": expect.objectContaining({
              notification:
                "an old man bursts through a door, wielding a scalpel.",
              combat: expect.objectContaining({
                enemy: "old man",
                hit: 0.5,
              }),
            }),
            "dried-meat": expect.objectContaining({
              text: ["strips of meat are hung up to dry in this ward."],
              loot: {
                "cured meat": { min: 3, max: 10, chance: 1 },
              },
            }),
            "operating-theatres": expect.objectContaining({
              text: [
                "the stench of rot and death fills the operating theatres.",
                "a few items are scattered on the ground.",
                "there is nothing else here.",
              ],
              loot: {
                "energy cell": { min: 1, max: 1, chance: 0.3 },
                medicine: { min: 1, max: 5, chance: 0.3 },
                teeth: { min: 3, max: 8, chance: 1 },
                scales: { min: 4, max: 7, chance: 0.9 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-hospital-old-man-squatters",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "old-man": expect.objectContaining({
              notification:
                "an old man bursts through a door, wielding a scalpel.",
              combat: expect.objectContaining({
                enemy: "old man",
                hit: 0.5,
              }),
            }),
            squatters: expect.objectContaining({
              notification:
                "a tribe of elderly squatters is camped out in this ward.",
              combat: expect.objectContaining({
                enemy: "squatters",
                attackDelay: 0.5,
                health: 40,
              }),
            }),
            "operating-theatres": expect.objectContaining({
              text: [
                "the stench of rot and death fills the operating theatres.",
                "a few items are scattered on the ground.",
                "there is nothing else here.",
              ],
              loot: {
                "energy cell": { min: 1, max: 1, chance: 0.3 },
                medicine: { min: 1, max: 5, chance: 0.3 },
                teeth: { min: 3, max: 8, chance: 1 },
                scales: { min: 4, max: 7, chance: 0.9 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-hospital-ward",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            hospital: expect.objectContaining({
              text: ["the shell of an abandoned hospital looms ahead."],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "enter",
                  cost: { torch: 1 },
                }),
              ]),
            }),
            corridors: expect.objectContaining({
              text: [
                "empty corridors.",
                "the place has been swept clean by scavengers.",
              ],
            }),
            lizards: expect.objectContaining({
              notification: "a pack of lizards rounds the corner.",
              combat: expect.objectContaining({
                enemy: "lizards",
                attackDelay: 0.7,
              }),
            }),
            "operating-theatres": expect.objectContaining({
              text: [
                "the stench of rot and death fills the operating theatres.",
                "a few items are scattered on the ground.",
                "there is nothing else here.",
              ],
              loot: {
                "energy cell": { min: 1, max: 1, chance: 0.3 },
                medicine: { min: 1, max: 5, chance: 0.3 },
                teeth: { min: 3, max: 8, chance: 1 },
                scales: { min: 4, max: 7, chance: 0.9 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-hospital-squatters",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            corridors: expect.objectContaining({
              text: [
                "empty corridors.",
                "the place has been swept clean by scavengers.",
              ],
            }),
            squatters: expect.objectContaining({
              notification:
                "a tribe of elderly squatters is camped out in this ward.",
              combat: expect.objectContaining({
                enemy: "squatters",
                attackDelay: 0.5,
                health: 40,
              }),
            }),
            "operating-theatres": expect.objectContaining({
              text: [
                "the stench of rot and death fills the operating theatres.",
                "a few items are scattered on the ground.",
                "there is nothing else here.",
              ],
              loot: {
                "energy cell": { min: 1, max: 1, chance: 0.3 },
                medicine: { min: 1, max: 5, chance: 0.3 },
                teeth: { min: 3, max: 8, chance: 1 },
                scales: { min: 4, max: 7, chance: 0.9 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-hospital-deformed",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "operating-theatre": expect.objectContaining({
              text: [
                "someone has locked and barricaded the door to this operating theatre.",
              ],
            }),
            deformed: expect.objectContaining({
              notification:
                "behind the door, a deformed figure awakes and attacks.",
              combat: expect.objectContaining({
                enemy: "deformed",
                hit: 0.6,
              }),
            }),
            equipment: expect.objectContaining({
              text: [
                "the warped man lies dead.",
                "the operating theatre has a lot of curious equipment.",
              ],
              loot: {
                "energy cell": { min: 2, max: 5, chance: 0.8 },
                medicine: { min: 3, max: 12, chance: 1 },
                cloth: { min: 1, max: 3, chance: 0.5 },
                steel: { min: 2, max: 3, chance: 0.3 },
                "alien alloy": { min: 1, max: 1, chance: 0.3 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-hospital-tentacles",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "operating-theatre": expect.objectContaining({
              text: [
                "someone has locked and barricaded the door to this operating theatre.",
              ],
            }),
            tentacles: expect.objectContaining({
              notification:
                "as soon as the door is open a little bit, hundreds of tentacles erupt.",
              combat: expect.objectContaining({
                enemy: "tentacles",
                attackDelay: 0.5,
              }),
            }),
            victims: expect.objectContaining({
              text: [
                "the tentacular horror is defeated.",
                "inside, the remains of its victims are everywhere.",
              ],
              loot: {
                "steel sword": { min: 1, max: 3, chance: 0.5 },
                rifle: { min: 1, max: 2, chance: 0.3 },
                teeth: { min: 2, max: 8, chance: 1 },
                cloth: { min: 3, max: 6, chance: 0.5 },
                "alien alloy": { min: 1, max: 1, chance: 0.1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.sulphurmine",
          title: "The Sulphur Mine",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              notification: "a military perimeter is set up around the mine.",
            }),
            a1: expect.objectContaining({
              combat: expect.objectContaining({
                enemy: "soldier",
              }),
            }),
            a2: expect.objectContaining({
              combat: expect.objectContaining({
                enemy: "soldier",
              }),
            }),
            a3: expect.objectContaining({
              combat: expect.objectContaining({
                enemy: "veteran",
              }),
            }),
            cleared: expect.objectContaining({
              notification: "the sulphur mine is clear of dangers",
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.coalmine",
          title: "The Coal Mine",
          scenes: expect.objectContaining({
            a1: expect.objectContaining({
              combat: expect.objectContaining({
                enemy: "man",
              }),
            }),
            a2: expect.objectContaining({
              combat: expect.objectContaining({
                enemy: "man",
              }),
            }),
            a3: expect.objectContaining({
              combat: expect.objectContaining({
                enemy: "chief",
              }),
            }),
            cleared: expect.objectContaining({
              notification: "the coal mine is clear of dangers",
            }),
          }),
        }),
      ]),
    );
    expect(setpieceEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "setpiece.ironmine",
          title: "The Iron Mine",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              notification: "the path leads to an abandoned mine",
            }),
            enter: expect.objectContaining({
              combat: expect.objectContaining({
                enemy: "beastly matriarch",
              }),
            }),
            cleared: expect.objectContaining({
              notification: "the iron mine is clear of dangers",
            }),
          }),
        }),
      ]),
    );
  });
});
