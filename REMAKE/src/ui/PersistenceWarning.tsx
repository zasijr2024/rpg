import { useCallback, useSyncExternalStore } from "react";
import type { GameSession } from "../engine";

export function PersistenceWarning({ session }: { session: GameSession }) {
  const subscribe = useCallback(
    (listener: () => void) => session.subscribeUi("navigation", listener),
    [session],
  );
  const getSnapshot = useCallback(
    () => session.uiSnapshot("navigation"),
    [session],
  );
  const navigation = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const persistence = navigation.persistence;
  const policyNotice = navigation.backgroundTimePolicyNotice;

  if (
    (persistence.status === "healthy" || persistence.status === "disabled") &&
    policyNotice === null
  ) {
    return null;
  }

  return (
    <>
      {policyNotice !== null && (
        <section
          className="backgroundTimeNotice"
          role="status"
          aria-label="background time policy"
        >
          <p>{policyNotice}</p>
          <button
            type="button"
            onClick={() => session.dismissBackgroundTimePolicyNotice()}
          >
            dismiss
          </button>
        </section>
      )}
      {persistence.status !== "healthy" &&
        persistence.status !== "disabled" && (
          <section
            className="persistenceWarning"
            role={persistence.status === "unavailable" ? "alert" : "status"}
            aria-label="saving status"
          >
            <p>{persistence.message}</p>
            <div className="persistenceWarningActions">
              {persistence.canRetry && (
                <button
                  type="button"
                  onClick={() => session.retryPersistence()}
                >
                  retry saving
                </button>
              )}
              {persistence.canExport && (
                <button type="button" onClick={() => exportRecovery(session)}>
                  export recovery
                </button>
              )}
            </div>
          </section>
        )}
    </>
  );
}

function exportRecovery(session: GameSession): void {
  const recovery = session.exportRecoverySnapshot();
  if (recovery === null) return;

  const url = URL.createObjectURL(
    new Blob([recovery], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "a-dark-room-recovery.json";
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
