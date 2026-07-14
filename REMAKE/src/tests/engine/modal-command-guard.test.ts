import { describe, expect, it } from "vitest";
import { createGameEngine, GameSession } from "../../engine";

describe("active event command guard", () => {
  it("blocks background navigation and gameplay commands until the event closes", () => {
    const session = new GameSession(createGameEngine({ rngSeed: 41 }));
    session.setStateForTest("features.location.outside", true);
    session.triggerEventByKeyForTest("room.beggar");

    expect(session.snapshot().event?.eventKey).toBe("room.beggar");
    session.setLocation("outside");
    session.lightFire();
    expect(session.snapshot().location).toBe("room");
    expect(session.snapshot().room.fire).toBe("dead");

    session.chooseEventButton("deny");
    expect(session.snapshot().event).toBeNull();
    session.setLocation("outside");
    expect(session.snapshot().location).toBe("outside");
  });
});
