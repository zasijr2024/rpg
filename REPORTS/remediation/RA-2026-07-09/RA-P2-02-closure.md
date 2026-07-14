# RA-P2-02 Closure: Save Backup, Recovery And Migration Tests

## Scope

Close M-05's production-save risk by making corruption, partial writes, incompatible schemas, backup recovery, and the explicitly supported remake migrations deterministic under the Production Beta boundary.

## Delivered

- `adr-remake-dev-save` now contains a checksummed schema-1 document whose storage version is independent from the current session/engine lifecycle payload version.
- Commits write an explicitly non-loadable staging generation, retain the previous decodable primary under `:backup`, replace the primary, and remove staging. Reset clears primary, staging, and backup together.
- Invalid JSON, malformed documents, checksum mismatches, and incompatible schema versions are quarantined with stable reasons. Storage-format failures recover the backup automatically.
- Engine/session validation failure rolls live state back, quarantines the primary, and attempts the backup once. Backup promotion consumes that generation so an invalid backup cannot loop across future startups.
- Unversioned session-v2, engine-v2, and legacy remake state snapshots are explicit supported migration inputs. They are rewritten into schema 1; unknown/future schemas and original-browser saves are not guessed.

## Compatibility Contract

- Durable storage schema: `1`.
- Current lifecycle payload: session/engine snapshot version `2` or the validated legacy remake state shape.
- Supported migration sources: unversioned session-v2, unversioned engine-v2, and unversioned legacy remake state.
- Unsupported input: malformed/unknown documents, future storage schema versions, and original-game browser saves. These are quarantined; a supported backup may still recover.
- Recovery depth: one previous committed generation. Staging never becomes authoritative.

## Deterministic Evidence

- Storage tests cover corrupt JSON, checksum damage, stale staging, interrupted primary writes, incompatible schema, backup promotion/consumption, and complete reset.
- Parameterized migrations cover all three supported unversioned remake families and assert the resulting schema-1 document.
- Session tests prove invalid current payloads do not mutate live state, a valid prior generation restores exact state, and an invalid backup is consumed instead of retried indefinitely.
- Existing atomic-save, clock-debt, RNG-continuation, runtime lifecycle, Ship, Fabricator, and Space round trips remain green through the envelope.
- Chromium corrupts the primary document after two visible autosave generations, reloads, and observes the prior visible Room generation plus the deterministic `checksum-mismatch` quarantine reason.

## Verification

- Focused save/tooling Vitest runs: passed.
- Focused Chromium 1366 save recovery: 2 passed.
- Focused Chromium 1366 background catch-up and UI save/load reloads: 2 passed.
- `npm run parity:check`: passed.
- `npm run typecheck:fixtures`: passed.
- `npm test`: 43 files, 455 tests passed.
- `npm run lint`: passed.
- `npm run format:check`: passed.
- `npm run build`: TypeScript and Vite passed; the known production chunk warning remains owned by `RA-P2-06/07`.
- `npm run test:e2e`: 306 passed, 130 expected skips, 5.4 minutes.

## Revision And Tree State

- Branch: `remake/parity`
- Base revision: `8b0938e963ba19df82779431f5aeaa4ff8ec06dd`
- The working tree was already dirty from the active remediation series. This package preserved prior work and changed only the save boundary, directly coupled tests, and required status/decision documentation.

## Residual Risks

- Original-browser save import remains deferred; it is not equivalent to migrating the three supported remake formats.
- The checksum detects accidental/truncated/tampered local data but is not a cryptographic authenticity mechanism against hostile same-origin code.
- Recovery intentionally retains one generation, not an unbounded history or cloud synchronization.
- Production Beta remains blocked by test-ownership, production-bundle, and performance packages. Cross-browser/real-zoom and accessibility evidence remain Release Candidate work.

## Result

`RA-P2-02` is complete. Production autosaves now have an explicit compatibility boundary and deterministic last-known-good recovery. `RA-P2-03 Browser and real zoom matrix` is active.
