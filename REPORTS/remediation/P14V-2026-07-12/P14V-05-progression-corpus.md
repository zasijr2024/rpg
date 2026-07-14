# P14V-05 Fixed Progression Corpus

Status: `READY_TO_RUN_ON_CANDIDATE`

The fail-closed corpus runner is implemented, and P14V-02/P14V-04 froze and validated candidate `d3696de28218bb6c7645302398e1a4b5fe7cba18`. No formal 32-seed result is recorded yet. Run the corpus from that clean candidate checkout; do not copy the dirty-worktree smoke or four-seed result into the final fields below.

## Execution Contract

- Command from `REMAKE/`: `npm run study:progression:corpus`
- Fixed range: seed indexes `0..31`
- Default shards: eight deterministic four-seed shards with two concurrent jobs
- Required JSON: `P14V-05-progression-32-seed.json` in this directory
- Clean guard: the runner refuses a dirty starting worktree unless `--allow-dirty` is explicitly supplied; an allow-dirty run is provisional and cannot close this package
- Validation: exact formula and range coverage, no duplicate/missing/extra/mutated seeds, classified incomplete outcomes, consistent completion state, and milestone bounds

## Final Evidence

- Revision: `d3696de28218bb6c7645302398e1a4b5fe7cba18`
- Starting worktree: `PENDING`
- Node/npm/platform: `PENDING`
- Exact command: `PENDING`
- JSON artifact: `PENDING`
- Result interpretation: `PENDING`
- Game-origin hard/soft locks: `PENDING`
- Decision: `PENDING`

The implementation smoke used one dirty-worktree seed only to exercise subprocess execution, artifact writing, environment capture, and aggregation. Its temporary artifact was deleted after validation and is not P14V-05 outcome evidence.
