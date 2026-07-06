import { useMemo, useReducer } from "react";
import { RoomRuntime, createGameEngine } from "../engine";
import { RoomView } from "./RoomView";
import { SpikeLab } from "./SpikeLab";

export function App() {
  const engine = useMemo(() => createGameEngine(), []);
  const room = useMemo(() => new RoomRuntime(engine), [engine]);
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const showSpikes = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("spikes") === "1";
  }, []);
  const snapshot = room.snapshot();

  return (
    <main className="appShell" aria-label="A Dark Room">
      <RoomView room={room} snapshot={snapshot} onAction={refresh} />
      {showSpikes && <SpikeLab />}
    </main>
  );
}
