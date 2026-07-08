import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import type {
  EventCombatActionSnapshot,
  EventLootActionSnapshot,
  EventPanelSnapshot,
} from "../engine";

interface EventPanelProps {
  event: EventPanelSnapshot | null;
  onChoose: (key: string) => void;
  onCombatAction: (key: string) => void;
  onLootAction: (key: string) => void;
}

export function EventPanel({
  event,
  onChoose,
  onCombatAction,
  onLootAction,
}: EventPanelProps) {
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!event) return;
    const panel = panelRef.current;
    if (!panel) return;
    const firstButton = panel.querySelector<HTMLButtonElement>(
      "button:not(:disabled)",
    );
    (firstButton ?? panel).focus();
  }, [event?.eventKey, event?.sceneKey]);

  if (!event) return null;

  return (
    <section
      ref={panelRef}
      className="eventPanel"
      aria-label="event"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={trapFocus}
    >
      <h2>{event.title}</h2>
      <div className="eventText">
        {event.combat ? (
          <CombatText event={event} onCombatAction={onCombatAction} />
        ) : (
          <>
            {event.text.map((line) => (
              <p key={line}>{line}</p>
            ))}
            {event.loot && (
              <LootText loot={event.loot} onLootAction={onLootAction} />
            )}
          </>
        )}
      </div>
      <div className="eventButtons">
        {event.combat
          ? visibleCombatActions(event.combat.actions).map((button) => (
              <button
                key={button.key}
                type="button"
                disabled={button.disabled}
                onClick={() => onCombatAction(button.key)}
              >
                <span className="buttonLabel">{button.text}</span>
                {button.cooldownRemainingMs > 0 && (
                  <span className="costText">
                    {Math.ceil(button.cooldownRemainingMs / 1000)}s
                  </span>
                )}
                {Object.keys(button.cost).length > 0 && (
                  <span className="costText">{formatCost(button.cost)}</span>
                )}
              </button>
            ))
          : [
              ...visibleLootActions(event.loot?.actions ?? []).map((button) => (
                <button
                  key={button.key}
                  type="button"
                  disabled={button.disabled}
                  onClick={() => onLootAction(button.key)}
                >
                  <span className="buttonLabel">{button.text}</span>
                </button>
              )),
              ...event.buttons.map((button) => (
                <button
                  key={button.key}
                  type="button"
                  disabled={button.disabled}
                  onClick={() => {
                    onChoose(button.key);
                    if (button.link) {
                      window.open(button.link, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  <span className="buttonLabel">{button.text}</span>
                  {Object.keys(button.cost).length > 0 && (
                    <span className="costText">{formatCost(button.cost)}</span>
                  )}
                </button>
              )),
            ]}
      </div>
    </section>
  );
}

function LootText({
  loot,
  onLootAction,
}: {
  loot: NonNullable<EventPanelSnapshot["loot"]>;
  onLootAction: (key: string) => void;
}) {
  const lootEntries = Object.entries(loot.loot);
  const takeActions = new Map(
    loot.actions
      .filter(
        (action) => action.kind === "take" && action.key.startsWith("take:"),
      )
      .map((action) => [action.key.slice("take:".length), action]),
  );
  const dropActions = loot.actions.filter(
    (action) => action.kind === "drop" && action.key.startsWith("dropFor:"),
  );

  return (
    <div className="combatLoot" aria-label="loot">
      {lootEntries.length > 0 ? (
        lootEntries.map(([key, amount]) => {
          const takeAction = takeActions.get(key);
          const itemDropActions = dropActions.filter(
            (action) => parseDropAction(action.key)?.lootKey === key,
          );
          return (
            <div className="combatLootRow" key={key}>
              <span>
                {key} [{amount}]
              </span>
              {takeAction && (
                <button
                  type="button"
                  className="lootTakeButton"
                  disabled={takeAction.disabled}
                  onClick={() => onLootAction(takeAction.key)}
                >
                  take
                </button>
              )}
              {takeAction?.disabled && itemDropActions.length > 0 && (
                <LootDropMenu
                  lootKey={key}
                  actions={itemDropActions}
                  onLootAction={onLootAction}
                />
              )}
            </div>
          );
        })
      ) : (
        <p>nothing to take</p>
      )}
    </div>
  );
}

function CombatText({
  event,
  onCombatAction,
}: {
  event: EventPanelSnapshot;
  onCombatAction: (key: string) => void;
}) {
  if (!event.combat) return null;
  const lootEntries = Object.entries(event.combat.loot);
  const lootTakeActions = new Map(
    event.combat.actions
      .filter(
        (action) => action.kind === "take" && action.key.startsWith("take:"),
      )
      .map((action) => [action.key.slice("take:".length), action]),
  );
  const lootDropActions = event.combat.actions.filter(
    (action) => action.kind === "drop" && action.key.startsWith("dropFor:"),
  );
  return (
    <>
      <p>{event.combat.status}</p>
      <div className="combatMeters" aria-label="combat">
        <div>
          @ {event.combat.playerHp}/{event.combat.playerMaxHp}
        </div>
        <div>
          {event.combat.chara} {event.combat.enemyHp}/{event.combat.enemyMaxHp}
        </div>
      </div>
      {event.combat.phase === "won" && (
        <div className="combatLoot" aria-label="loot">
          {lootEntries.length > 0 ? (
            lootEntries.map(([key, amount]) => {
              const takeAction = lootTakeActions.get(key);
              const dropActions = lootDropActions.filter(
                (action) => parseDropAction(action.key)?.lootKey === key,
              );
              return (
                <div className="combatLootRow" key={key}>
                  <span>
                    {key} [{amount}]
                  </span>
                  {takeAction && (
                    <button
                      type="button"
                      className="lootTakeButton"
                      disabled={takeAction.disabled}
                      onClick={() => onCombatAction(takeAction.key)}
                    >
                      take
                    </button>
                  )}
                  {takeAction?.disabled && dropActions.length > 0 && (
                    <LootDropMenu
                      lootKey={key}
                      actions={dropActions}
                      onLootAction={onCombatAction}
                    />
                  )}
                </div>
              );
            })
          ) : (
            <p>nothing to take</p>
          )}
        </div>
      )}
    </>
  );
}

function LootDropMenu({
  lootKey,
  actions,
  onLootAction,
}: {
  lootKey: string;
  actions: Array<EventCombatActionSnapshot | EventLootActionSnapshot>;
  onLootAction: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  const closeMenu = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setOpen(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    }
  };

  return (
    <div
      className="lootDropMenu"
      data-open={open ? "true" : "false"}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={toggleRef}
        type="button"
        className="lootDropToggle"
        aria-label={`drop carried items for ${lootKey}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        onFocus={() => setOpen(true)}
      >
        drop
      </button>
      <div id={menuId} className="lootDropList" role="menu">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLootAction(action.key);
            }}
          >
            {action.text}
          </button>
        ))}
      </div>
    </div>
  );
}

function visibleCombatActions(
  actions: EventCombatActionSnapshot[],
): EventCombatActionSnapshot[] {
  return actions.filter((action) => {
    if (action.kind === "drop") return false;
    if (action.kind === "take" && action.key.startsWith("take:")) {
      return false;
    }
    return true;
  });
}

function visibleLootActions(
  actions: EventLootActionSnapshot[],
): EventLootActionSnapshot[] {
  return actions.filter(
    (action) => action.kind === "take" && action.key === "takeEverything",
  );
}

function parseDropAction(actionKey: string): { lootKey: string } | null {
  const [, lootKey] = actionKey.split(":");
  return lootKey ? { lootKey } : null;
}

function trapFocus(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab") return;
  const buttons = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>(
      "button:not(:disabled)",
    ),
  );
  if (buttons.length === 0) {
    event.preventDefault();
    event.currentTarget.focus();
    return;
  }

  const first = buttons[0];
  const last = buttons[buttons.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

function formatCost(cost: Record<string, number>): string {
  return Object.entries(cost)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}
