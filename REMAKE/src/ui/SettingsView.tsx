import type {
  GameDebugSettingsSnapshot,
  GameLocationKey,
  OutsideStateSnapshot,
  RoomStateSnapshot,
} from "../engine";
import "./styles/settings.css";

interface SettingsViewProps {
  settings: GameDebugSettingsSnapshot;
  location: GameLocationKey;
  room: RoomStateSnapshot;
  outside: OutsideStateSnapshot;
  saveStatus: string;
  onToggleSpeedX10: (enabled: boolean) => void;
  onToggleIncomeX10: (enabled: boolean) => void;
  onSave: () => void;
  onLoad: () => void;
  onClear: () => void;
}

export function SettingsView({
  settings,
  location,
  room,
  outside,
  saveStatus,
  onToggleSpeedX10,
  onToggleIncomeX10,
  onSave,
  onLoad,
  onClear,
}: SettingsViewProps) {
  return (
    <section
      className="settingsPanel"
      aria-label="settings"
      data-focus-owner="settings"
      tabIndex={-1}
    >
      <div className="settingsColumn">
        <section className="settingsGroup" aria-label="debug toggles">
          <label className="toggleRow">
            <input
              type="checkbox"
              checked={settings.speedX10}
              onChange={(event) =>
                onToggleSpeedX10(event.currentTarget.checked)
              }
            />
            <span>speed x 10</span>
          </label>
          <label className="toggleRow">
            <input
              type="checkbox"
              checked={settings.incomeX10}
              onChange={(event) =>
                onToggleIncomeX10(event.currentTarget.checked)
              }
            />
            <span>income x 10</span>
          </label>
        </section>

        <section className="settingsGroup" aria-label="dev save">
          <div className="settingsButtons">
            <button type="button" onClick={onSave}>
              save
            </button>
            <button type="button" onClick={onLoad}>
              load
            </button>
            <button type="button" onClick={onClear}>
              clear
            </button>
          </div>
          <DebugRow label="status" value={saveStatus} />
        </section>

        <section className="settingsGroup" aria-label="debug info">
          <DebugRow
            label="time"
            value={`${Math.floor(settings.nowMs / 1000)}s`}
          />
          <DebugRow label="location" value={location} />
          <DebugRow label="speed" value={`${settings.speedMultiplier}x`} />
          <DebugRow label="income" value={`${settings.incomeMultiplier}x`} />
          <DebugRow label="fire" value={`${room.fire} (${room.fireValue})`} />
          <DebugRow
            label="room"
            value={`${room.temperature} (${room.temperatureValue})`}
          />
          <DebugRow label="builder" value={room.builderLevel} />
          {outside.unlocked && <DebugRow label="outside" value="unlocked" />}
          {room.wood !== undefined && (
            <DebugRow label="wood" value={room.wood} />
          )}
        </section>
      </div>
    </section>
  );
}

function DebugRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="debugRow">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
