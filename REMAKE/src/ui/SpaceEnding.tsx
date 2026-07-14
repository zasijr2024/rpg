import { useLayoutEffect, useRef } from "react";
import type { SpaceStateSnapshot } from "../engine";

export function SpaceEnding({
  snapshot,
  onContinue,
  onRestart,
}: {
  snapshot: SpaceStateSnapshot;
  onContinue: () => void;
  onRestart: () => void;
}) {
  const focusOwner = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => focusOwner.current?.focus(), [snapshot.endingStage]);

  if (snapshot.endingStage === "fleet") {
    return (
      <section
        className="endingPanel fleetEnding"
        aria-label="fleet ending"
        data-focus-owner="space"
        ref={focusOwner}
        tabIndex={-1}
      >
        <header className="endingHeader">
          <p className="endingMarker" aria-hidden="true">
            ...
          </p>
          <h1>homefleet</h1>
        </header>
        <div className="endingNarrative">
          <p>
            the beacon pulses gently as the ship glides through space.
            <br />
            coordinates are locked. nothing to do but wait.
          </p>
          <p>
            the beacon glows a solid blue, and then goes dim. the ship slows.
            <br />
            gradually, the vast wanderer homefleet comes into view.
            <br />
            massive worldships drift unnaturally through clouds of debris,
            scarred and dead.
          </p>
        </div>
        <div className="endingCoda">
          <p>the air is running out.</p>
          <p>the capsule is cold.</p>
        </div>
        <button className="endingAction" type="button" onClick={onContinue}>
          wait
        </button>
      </section>
    );
  }
  return (
    <section
      className="endingPanel"
      aria-label="ending"
      data-focus-owner="space"
      ref={focusOwner}
      tabIndex={-1}
    >
      <header className="endingHeader">
        <p className="endingMarker" aria-hidden="true">
          ...
        </p>
        <h1>the end.</h1>
      </header>
      <div className="endingScores" aria-label="final scores">
        <p>
          <span>score for this game: </span>
          <strong>{snapshot.score}</strong>
        </p>
        <p>
          <span>total score: </span>
          <strong>{snapshot.totalScore}</strong>
        </p>
      </div>
      <button className="endingAction" type="button" onClick={onRestart}>
        restart.
      </button>
    </section>
  );
}
