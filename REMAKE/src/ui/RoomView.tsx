import type { RoomRuntime, RoomStateSnapshot } from "../engine";

interface RoomViewProps {
  room: RoomRuntime;
  snapshot: RoomStateSnapshot;
  onAction: () => void;
}

export function RoomView({ room, snapshot, onAction }: RoomViewProps) {
  const runAction = (action: () => void) => {
    action();
    onAction();
  };

  return (
    <section className="roomPanel" aria-labelledby="room-title">
      <h1 id="room-title">{snapshot.title}</h1>

      <div className="roomStatus" aria-label="room status">
        <div>
          <span>the fire is </span>
          <strong>{snapshot.fire}</strong>
        </div>
        <div>
          <span>the room is </span>
          <strong>{snapshot.temperature}</strong>
        </div>
      </div>

      <div className="actionRow">
        {snapshot.activeButton === "light fire" ? (
          <button type="button" onClick={() => runAction(() => room.lightFire())}>
            light fire
          </button>
        ) : (
          <button type="button" onClick={() => runAction(() => room.stokeFire())}>
            stoke fire
          </button>
        )}
      </div>

      {snapshot.wood !== undefined && (
        <section className="storesPanel" aria-label="stores">
          <div className="storeRow">
            <span>wood</span>
            <span>{Math.floor(snapshot.wood)}</span>
          </div>
        </section>
      )}

      {snapshot.notifications.length > 0 && (
        <section className="notificationsPanel" aria-label="notifications">
          {snapshot.notifications.map((notification) => (
            <p key={notification.id}>{notification.message}</p>
          ))}
        </section>
      )}
    </section>
  );
}
