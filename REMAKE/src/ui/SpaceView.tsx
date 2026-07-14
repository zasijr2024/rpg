import { lazy, Suspense, useEffect, useRef, type KeyboardEvent } from "react";
import { SPACE_PANEL_SIZE } from "../content/original";
import type { SpaceMoveDirection, SpaceStateSnapshot } from "../engine";

const SpaceSpatialFeed = lazy(() =>
  import("./SpaceSpatialFeed").then(({ SpaceSpatialFeed }) => ({
    default: SpaceSpatialFeed,
  })),
);
const SpaceEnding = lazy(() =>
  import("./SpaceEnding").then(({ SpaceEnding }) => ({ default: SpaceEnding })),
);

interface SpaceViewProps {
  snapshot: SpaceStateSnapshot;
  onMove: (direction: SpaceMoveDirection) => void;
  onMovementChange: (direction: SpaceMoveDirection, active: boolean) => void;
  onContinueEnding: () => void;
  onRestart: () => void;
}

export function SpaceView({
  snapshot,
  onMove,
  onMovementChange,
  onContinueEnding,
  onRestart,
}: SpaceViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || snapshot.phase !== "flying") return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const { ascent, background, foreground } = spaceFlightColors(
      snapshot.altitude,
    );
    context.fillStyle = `rgb(${background} ${background} ${background})`;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = `rgb(255 255 255 / ${ascent})`;
    for (let index = 0; index < 200; index += 1) {
      const x = (index * 137 + 53) % canvas.width;
      const y = (index * 257 + snapshot.altitude * 17) % canvas.height;
      context.fillText(".", x, y);
    }
    context.fillStyle = `rgb(${foreground} ${foreground} ${foreground})`;
    context.font = '18px "Courier New", monospace';
    context.textAlign = "center";
    context.textBaseline = "middle";
    for (const asteroid of snapshot.asteroids) {
      context.fillText(asteroid.glyph, asteroid.x, asteroid.y);
    }
    context.fillText("@", snapshot.shipX, snapshot.shipY);
  }, [snapshot]);

  useEffect(() => {
    if (snapshot.phase === "flying") document.title = snapshot.title;
  }, [snapshot.phase, snapshot.title]);

  if (snapshot.phase === "ending") {
    return (
      <Suspense fallback={null}>
        <SpaceEnding
          snapshot={snapshot}
          onContinue={onContinueEnding}
          onRestart={onRestart}
        />
      </Suspense>
    );
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const direction = directionForKey(event.key);
    if (!direction) return;
    event.preventDefault();
    onMovementChange(direction, true);
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLElement>) => {
    const direction = directionForKey(event.key);
    if (!direction) return;
    event.preventDefault();
    onMovementChange(direction, false);
  };

  return (
    <section
      className="spacePanel"
      aria-label="space flight"
      data-focus-owner="space"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onBlur={() => {
        for (const direction of ["north", "south", "east", "west"] as const) {
          onMovementChange(direction, false);
        }
      }}
    >
      <Suspense fallback={null}>
        <SpaceSpatialFeed snapshot={snapshot} />
      </Suspense>
      <div className="spaceFlightStage">
        <div className="spaceReadout">
          <h1>{snapshot.title}</h1>
          <p>
            hull: {snapshot.hull}/{snapshot.maxHull}
          </p>
          <p>altitude: {snapshot.altitude}</p>
        </div>
        <canvas
          ref={canvasRef}
          className="spaceCanvas spaceFlightCanvas"
          width={SPACE_PANEL_SIZE}
          height={SPACE_PANEL_SIZE}
          role="img"
          aria-label={`visual flight display: ship and ${snapshot.asteroids.length} pieces of debris`}
        />
      </div>
      <div className="spaceControls" aria-label="flight controls">
        <button type="button" onClick={() => onMove("north")}>
          north
        </button>
        <button type="button" onClick={() => onMove("west")}>
          west
        </button>
        <button type="button" onClick={() => onMove("south")}>
          south
        </button>
        <button type="button" onClick={() => onMove("east")}>
          east
        </button>
      </div>
      <p className="spaceInstructions">
        steer with arrow keys, WASD, or the flight controls
      </p>
    </section>
  );
}

export function spaceFlightColors(altitude: number): {
  ascent: number;
  background: number;
  foreground: 0 | 255;
} {
  const ascent = Math.min(1, Math.max(0, altitude / 60));
  const background = Math.round(255 * (1 - ascent));
  // The original switches the playfield foreground during the ascent. Keep
  // that discrete transition so essential ship/debris glyphs never merge
  // into the animated grey background.
  const foreground = background >= 118 ? 0 : 255;
  return { ascent, background, foreground };
}

function directionForKey(key: string): SpaceMoveDirection | null {
  if (key === "ArrowUp" || key.toLowerCase() === "w") return "north";
  if (key === "ArrowDown" || key.toLowerCase() === "s") return "south";
  if (key === "ArrowLeft" || key.toLowerCase() === "a") return "west";
  if (key === "ArrowRight" || key.toLowerCase() === "d") return "east";
  return null;
}
