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
                <button
                  type="button"
                  onClick={() => downloadRecoverySnapshot(session)}
                >
                  export recovery
                </button>
              )}
            </div>
          </section>
        )}
    </>
  );
}

export function downloadRecoverySnapshot(session: GameSession): boolean {
  try {
    const recovery = session.exportRecoverySnapshot();
    if (recovery === null) return false;

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
    window.setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // The recovery file has already been handed to the browser.
      }
    }, 0);
    return true;
  } catch {
    return false;
  }
}
