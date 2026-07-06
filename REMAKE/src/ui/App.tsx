import { useMemo } from "react";
import { createGameEngine } from "../engine";

export function App() {
  const engine = useMemo(() => createGameEngine(), []);
  const snapshot = engine.getSnapshot();

  return (
    <main className="appShell" aria-label="A Dark Room remake scaffold">
      <section className="panel" aria-labelledby="title">
        <p className="eyebrow">implementation scaffold</p>
        <h1 id="title">A Dark Room</h1>
        <p className="statusLine">
          Headless engine online. Gameplay is not implemented yet.
        </p>
        <dl className="metaGrid">
          <div>
            <dt>source baseline</dt>
            <dd>{snapshot.sourceCommit}</dd>
          </div>
          <div>
            <dt>save scope</dt>
            <dd>{snapshot.saveScope}</dd>
          </div>
          <div>
            <dt>rng</dt>
            <dd>{snapshot.rngKind}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

