import { useId, useState, type ChangeEvent } from "react";
import type { GameSession } from "../engine";

export function RecoveryImport({ session }: { session: GameSession }) {
  const statusId = useId();
  const [status, setStatus] = useState("");
  const [stagedFile, setStagedFile] = useState<{
    name: string;
    contents: string;
  } | null>(null);

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      setStagedFile({ name: file.name, contents: await file.text() });
      setStatus(`${file.name} is ready; the current session has not changed`);
    } catch {
      setStagedFile(null);
      setStatus("recovery file could not be read");
    } finally {
      input.value = "";
    }
  };

  const confirmImport = () => {
    if (!stagedFile) return;
    try {
      const result = session.importRecoverySnapshot(stagedFile.contents);
      setStagedFile(null);
      if (result.status === "imported") {
        setStatus(
          result.persisted
            ? "recovery imported and saved"
            : "recovery imported; browser storage is unavailable",
        );
      } else {
        setStatus(`recovery file rejected (${readableReason(result.reason)})`);
      }
    } catch {
      setStagedFile(null);
      setStatus("recovery import failed; the current session was kept");
    }
  };

  return (
    <details className="recoveryImport">
      <summary>recovery</summary>
      <div className="recoveryImportBody">
        <label className="recoveryImportLabel">
          import recovery file
          <input
            type="file"
            accept=".json,application/json"
            aria-describedby={status ? statusId : undefined}
            onChange={onFileChange}
          />
        </label>
        {stagedFile && (
          <section
            className="recoveryImportConfirmation"
            role="group"
            aria-label="confirm recovery import"
          >
            <p>
              selected: <strong>{stagedFile.name}</strong>
            </p>
            <p>this will replace the current game session.</p>
            <div>
              <button type="button" onClick={confirmImport}>
                replace current session
              </button>
              <button
                type="button"
                onClick={() => {
                  setStagedFile(null);
                  setStatus("recovery import cancelled; current session kept");
                }}
              >
                cancel
              </button>
            </div>
          </section>
        )}
        {status && (
          <p id={statusId} role="status">
            {status}
          </p>
        )}
      </div>
    </details>
  );
}

function readableReason(reason: string) {
  return reason.replaceAll("-", " ");
}
