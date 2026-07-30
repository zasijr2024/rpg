import type { GameUiSnapshotMap } from "../engine";

export function RuntimeFailureWarning({
  failure,
  onDismiss,
}: {
  failure: GameUiSnapshotMap["navigation"]["runtimeFailure"];
  onDismiss: () => void;
}) {
  if (!failure) return null;

  return (
    <section
      className="runtimeFailureWarning"
      role="alert"
      aria-label="action failure"
    >
      <p>
        that action could not be completed. its game-state changes were undone.
      </p>
      <p className="runtimeFailureDetails">
        {failure.commandType}: {failure.message}
      </p>
      <button type="button" onClick={onDismiss}>
        dismiss
      </button>
    </section>
  );
}
