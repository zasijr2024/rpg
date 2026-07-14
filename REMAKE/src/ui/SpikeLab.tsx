import { useEffect, useMemo, useRef, useState } from "react";
import {
  createAsciiViewport,
  viewportToText,
} from "../spikes/world/asciiViewport";
import {
  createInitialSpaceState,
  DEFAULT_SPACE_PROTOTYPE,
} from "../spikes/space/spacePrototype";
import "./styles/spike-lab.css";

const tabs = ["room", "world", "space"] as const;
type SpikeTab = (typeof tabs)[number];

export function SpikeLab() {
  const [activeTab, setActiveTab] = useState<SpikeTab>("room");
  const [cursor, setCursor] = useState({ x: 30, y: 30 });
  const viewport = useMemo(() => createAsciiViewport(), []);
  const mapText = useMemo(() => viewportToText(viewport), [viewport]);

  return (
    <section className="spikeLab" aria-labelledby="spike-title">
      <h2 id="spike-title">Phase 0.5 risk spike</h2>
      <div className="tabList" role="tablist" aria-label="Spike views">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className="tabButton"
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "room" && (
        <div role="tabpanel" className="spikePanel">
          <button type="button">light fire</button>
          <button type="button">stoke fire</button>
          <p>Keyboard focus and compact action rows are being tested here.</p>
        </div>
      )}

      {activeTab === "world" && (
        <div role="tabpanel" className="spikePanel">
          <WorldKeyboardProbe cursor={cursor} setCursor={setCursor} />
          <pre
            className="worldSpike"
            aria-label="61 by 61 ASCII world viewport"
          >
            {mapText}
          </pre>
        </div>
      )}

      {activeTab === "space" && (
        <div role="tabpanel" className="spikePanel spaceSpikeGrid">
          <CanvasSpaceSpike />
          <DomSpaceSpike />
        </div>
      )}
    </section>
  );
}

interface WorldKeyboardProbeProps {
  cursor: { x: number; y: number };
  setCursor: (cursor: { x: number; y: number }) => void;
}

function WorldKeyboardProbe({ cursor, setCursor }: WorldKeyboardProbeProps) {
  return (
    <button
      type="button"
      className="keyboardProbe"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
          setCursor({ x: cursor.x + 1, y: cursor.y });
        }
        if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
          setCursor({ x: cursor.x - 1, y: cursor.y });
        }
        if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
          setCursor({ x: cursor.x, y: cursor.y - 1 });
        }
        if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
          setCursor({ x: cursor.x, y: cursor.y + 1 });
        }
      }}
    >
      world keyboard probe {cursor.x},{cursor.y}
    </button>
  );
}

function CanvasSpaceSpike() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const state = createInitialSpaceState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111";
    ctx.font = "18px monospace";
    ctx.fillText("@", state.shipX, state.shipY);
    ctx.fillText("#", state.asteroidX, state.asteroidY);
  }, []);

  return (
    <figure>
      <figcaption>Canvas space prototype</figcaption>
      <canvas
        ref={ref}
        className="spaceCanvas"
        width={DEFAULT_SPACE_PROTOTYPE.width}
        height={DEFAULT_SPACE_PROTOTYPE.height}
        aria-label="Canvas space prototype"
      />
    </figure>
  );
}

function DomSpaceSpike() {
  const state = createInitialSpaceState();

  return (
    <figure>
      <figcaption>DOM space prototype</figcaption>
      <div className="spaceDom" aria-label="DOM space prototype">
        <span
          className="spaceShip"
          style={{
            left: `${(state.shipX / DEFAULT_SPACE_PROTOTYPE.width) * 100}%`,
            top: `${(state.shipY / DEFAULT_SPACE_PROTOTYPE.height) * 100}%`,
          }}
        >
          @
        </span>
        <span
          className="spaceAsteroid"
          style={{
            left: `${(state.asteroidX / DEFAULT_SPACE_PROTOTYPE.width) * 100}%`,
            top: `${(state.asteroidY / DEFAULT_SPACE_PROTOTYPE.height) * 100}%`,
          }}
        >
          #
        </span>
      </div>
    </figure>
  );
}
