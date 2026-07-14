/* eslint-disable @typescript-eslint/no-unused-vars -- Contract slices retain shared local fixtures. */
import { describe, expect, it } from "vitest";
import {
  canonicalManifest,
  originalExecutionerCombatDefinitions,
  originalEventDefinitions,
  originalSetpieceCombatDefinitions,
} from "../../../content/original";

describe("Event data executioner coverage", () => {
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
                  text: "blow it down",
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
});
