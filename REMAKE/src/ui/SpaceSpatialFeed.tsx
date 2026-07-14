import { useEffect, useRef, useState } from "react";
import {
  SPACE_PANEL_SIZE,
  SPACE_SHIP_MAX_POSITION,
  SPACE_SHIP_MIN_POSITION,
} from "../content/original";
import type { SpaceStateSnapshot } from "../engine";

const ASTEROID_WIDTH = 20;
const ASTEROID_HEIGHT = 37;

export interface SpaceSpatialDescription {
  shipPosition: string;
  nearestDebris: string;
  collisionThreat: string;
  announcement: string;
  threatLevel: "clear" | "potential" | "high" | "imminent";
  escapeDirection: "" | "west" | "east";
}

export function SpaceSpatialFeed({
  snapshot,
}: {
  snapshot: SpaceStateSnapshot;
}) {
  const [enabled, setEnabled] = useState(false);
  const description = describeSpatialFlight(snapshot);
  const latestAnnouncement = useRef(description.announcement);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    latestAnnouncement.current = description.announcement;
  }, [description.announcement]);

  useEffect(() => {
    if (!enabled || snapshot.phase !== "flying") return undefined;
    const interval = window.setInterval(
      () => setAnnouncement(latestAnnouncement.current),
      1_500,
    );
    return () => window.clearInterval(interval);
  }, [enabled, snapshot.phase]);

  return (
    <>
      <div className="spaceAssistToggle">
        <button
          type="button"
          aria-pressed={enabled}
          aria-describedby="space-spatial-feed-help"
          onClick={() => {
            setEnabled(!enabled);
            setAnnouncement(!enabled ? description.announcement : "");
          }}
        >
          {enabled
            ? "turn spatial flight feed off"
            : "turn spatial flight feed on"}
        </button>
        <span id="space-spatial-feed-help">
          optional position and collision announcements
        </span>
      </div>
      {enabled && (
        <section className="spaceSpatialFeed" aria-label="spatial flight feed">
          <h2>spatial flight feed</h2>
          <p>{description.shipPosition}</p>
          <p>{description.nearestDebris}</p>
          <p data-threat-level={description.threatLevel}>
            {description.collisionThreat}
          </p>
          <p
            className="screenReaderOnly"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {announcement}
          </p>
          <p className="screenReaderOnly" role="alert" aria-atomic="true">
            {enabled && description.escapeDirection
              ? `danger, move ${description.escapeDirection}.`
              : ""}
          </p>
        </section>
      )}
    </>
  );
}

/** A concise nonvisual model of the runtime's collision geometry. */
export function describeSpatialFlight(
  snapshot: SpaceStateSnapshot,
): SpaceSpatialDescription {
  const column = sector(snapshot.shipX, "west", "east");
  const row = sector(snapshot.shipY, "north", "south");
  const shipPosition = `altitude ${snapshot.altitude}; ship position: ${column} column, ${row} row; x ${Math.round(snapshot.shipX)}, y ${Math.round(snapshot.shipY)}.`;
  const debris = snapshot.asteroids.map((asteroid) => {
    const dx = asteroid.x + ASTEROID_WIDTH / 2 - snapshot.shipX;
    const dy = asteroid.y + ASTEROID_HEIGHT / 2 - snapshot.shipY;
    const verticalGap = snapshot.shipY - asteroid.y - ASTEROID_HEIGHT;
    return {
      dx,
      dy,
      verticalGap,
      distance: Math.hypot(dx, dy),
      inLane:
        verticalGap >= 0 &&
        asteroid.x <= snapshot.shipX &&
        asteroid.x + ASTEROID_WIDTH >= snapshot.shipX,
    };
  });
  const nearest = [...debris].sort((a, b) => a.distance - b.distance)[0];
  const nearestDebris = nearest
    ? `nearest debris: ${direction(nearest.dx, nearest.dy)}, ${distance(nearest.distance)} away.`
    : "nearest debris: none in the flight area.";
  const collision = debris
    .filter(({ inLane }) => inLane)
    .sort((a, b) => a.verticalGap - b.verticalGap)[0];
  let threatLevel: SpaceSpatialDescription["threatLevel"] = "clear";
  let escapeDirection: SpaceSpatialDescription["escapeDirection"] = "";
  let collisionThreat = "collision threat: clear.";
  if (collision) {
    threatLevel =
      collision.verticalGap <= 90
        ? "imminent"
        : collision.verticalGap <= 220
          ? "high"
          : "potential";
    escapeDirection = collision.dx >= 0 ? "west" : "east";
    if (
      (escapeDirection === "west" &&
        snapshot.shipX <= SPACE_SHIP_MIN_POSITION + 20) ||
      (escapeDirection === "east" &&
        snapshot.shipX >= SPACE_SHIP_MAX_POSITION - 20)
    ) {
      escapeDirection = escapeDirection === "west" ? "east" : "west";
    }
    collisionThreat = `collision threat: ${threatLevel}; debris in the collision lane ${distance(collision.verticalGap)} north; move ${escapeDirection}.`;
  }
  return {
    shipPosition,
    nearestDebris,
    collisionThreat,
    announcement: `${shipPosition} ${nearestDebris} ${collisionThreat}`,
    threatLevel,
    escapeDirection,
  };
}

function sector<T extends string>(position: number, low: T, high: T) {
  return position < SPACE_PANEL_SIZE / 3
    ? low
    : position > (SPACE_PANEL_SIZE * 2) / 3
      ? high
      : "center";
}

function direction(dx: number, dy: number) {
  if (Math.hypot(dx, dy) < 1) return "at the ship";
  const eastWest = dx < 0 ? "west" : "east";
  const northSouth = dy < 0 ? "north" : "south";
  if (Math.abs(dx) < Math.abs(dy) / 2) return northSouth;
  if (Math.abs(dy) < Math.abs(dx) / 2) return eastWest;
  return `${northSouth}-${eastWest}`;
}

function distance(value: number) {
  return value < 10
    ? "less than 10 pixels"
    : `${Math.round(value / 10) * 10} pixels`;
}
