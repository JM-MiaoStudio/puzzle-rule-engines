# Rules and API guide

Coordinates are zero-based `{ x, y }`; boards are row-major arrays indexed as `board[y][x]`. Tile kinds are numeric identifiers. Rendering and input handling belong to the caller.

## Tile-link (`link`)

A board cell is a numeric tile kind or `null`. Two distinct, occupied cells of the same kind may be removed when an orthogonal path connects them with at most two turns. The path may cross empty cells and a single blank border outside the board, but cannot pass through other occupied cells.

- `findLink(board, a, b)` returns endpoints and corners, or `null`.
- `findPairs(board, limit?)` enumerates currently legal pairs using that same rule.
- `linkLevel(id, rulesVersion?)` selects a versioned definition.
- `generateBoard(level, seed)` returns a board, random state, and a complete removal sequence in `solution`. This is a construction witness for that generated board.
- `shuffleBoard(board, seed)` preserves remaining kind counts and holes and arranges a playable pair for supported inputs. It does not provide a full-clear witness for an arbitrary shuffled board.
- `LinkSession` accepts `pair`, `hint`, and `shuffle` actions. Invalid pair actions return `null`. When a removal exposes a deadlock, the session automatically shuffles. Empty boards win; finished sessions reject further actions.
- `getReplay()` and `LinkSession.restore(...)` export and replay versioned actions and the original seed. Consecutive hints and shuffles may use `repeat` compression.

The generated witness applies to its original sequence. Arbitrary player choices, manual shuffles, or board mutation can invalidate it. Directly mutating exported definitions can also change behavior; applications should treat definitions as read-only.

## Match-3 (`match3`)

Cells have `id`, `kind`, and `special`. Orthogonally adjacent swaps are accepted when they create a match involving a swapped cell or activate a special combination. Other swaps roll back. Ordinary matches contain at least three equal kinds in a straight row or column. Wild specials do not participate as ordinary matching cells.

Matches clear, existing effects chain, tiles fall, and seeded refill resolves cascades. A four-match creates a row or column special; an intersecting row/column match creates an area special; a run of at least five takes priority and creates a wild special. Creation uses a suitable matched anchor, preferring the swapped positions. Spawned specials retain a tile kind.

Special effects:

- Row / column: clear that row / column.
- Area: clear a radius-one square, clipped at the board edge.
- Wild with an ordinary tile: clear that tile kind.
- Wild with another special: convert the matching kind to that special and trigger its effects.
- Wild + wild: clear the board.
- Area + area: clear a radius-two square around the swap destination.
- Area + row/column: clear three rows and three columns around the destination.
- Two row/column specials: clear the destination row and column.

Special combinations consume their effects without also spawning free match specials. A wild triggered by another effect selects a kind through the model's seeded random state.

`Match3` is the board model: use `snapshot()`, `findMoves()`, `swap(a, b)`, and `getReplay()`. `LevelSession(getLevel(id))` adds level goals and a move budget on a 9×9 board. Invalid swaps spend no move; a valid swap spends one move regardless of cascade count. Goals count removed tiles by kind, or all removed tiles when `kind` is `null`. Goals completed on the last move win; otherwise exhausting the budget loses. Terminal sessions reject further swaps.

## Catalogs and evaluation

The link catalog contains 20 base layouts and generated definitions beyond them. The match-3 catalog contains ten frozen tutorial definitions, generated definitions, and seed tables. Current match-3 IDs 101–1000 map to 900 seed templates. Later IDs reuse them in balanced cycles. Numeric definitions and seeds were retained during extraction while descriptive labels were neutralized.

`playVisible` evaluates visible-board moves with a heuristic policy, then plays against normal seeded refill. It does not peek at refill randomness when scoring a candidate. A successful path is evidence for that tested run only; failure is not proof a level is impossible. Neither heuristic scores nor catalog labels establish player difficulty.

## Local progress and trust boundaries

`Campaign` tracks local completion and contiguous unlock progress. `mergeCompleted` merges supplied completion IDs; callers are responsible for trusting that input. `RoundSave` persists match-3 moves and a small local context (`runId`, `accountId`, `startedAt`). `readLinkStorage` reads link replay and completion data independently so damage to one record need not discard the other.

These adapters do not contact a server, verify a person's identity, award points, or authenticate a replay. Match-3 `RoundSave` includes size and action validation, but callers still need ingress limits. In particular, cap link replay JSON size, action count, and expanded `repeat` count before restore. A compact repeated-shuffle record can require substantial CPU time. Validate dimensions, rectangular shape, values, coordinates, and resource budgets for custom inputs before library calls.

## Engine exceptions

If an engine operation throws (including a cascade-budget exception), discard that model/session and restore a previously valid replay rather than continuing it. The exception path is not guaranteed to roll back every internal random/identity counter.
