# Puzzle Rule Engines

纯 TypeScript 连连看／三消规则引擎，采用 MIT 许可证。包括确定性关卡生成、连连看完整解证、三消可见棋盘启发式求解、动作重放与本地存档；无运行时依赖，不含客户 IP 素材、音频、账号或积分后台。三消启发式不是通用求解器，支持的 100 万关编号也不代表 100 万个独立关卡。

Engine-independent TypeScript rules for tile-link and match-3 games. The package exports `link` and `match3` namespaces, has no runtime dependencies, and includes deterministic generation, sessions, replay, local storage adapters, and synthetic tests.

## Package and license

Version **0.1.0** is a standalone source package under the [MIT License](LICENSE), copyright 2026 JM-MiaoStudio. It is prepared for use from source; it has not been published to the npm registry.

This extraction contains rules and numeric catalog data only. It excludes artwork, audio, UI scenes, customer branding and assets, backend services, points or rewards integrations, credentials, and source archives. The former Cocos Creator 3.8.3 integration is not bundled or required.

## Build and check

Use Node.js 22.14 or later. From this package directory:

```sh
npm ci --ignore-scripts
npm run verify
```

`verify` builds CommonJS JavaScript and TypeScript declarations into `dist`, typechecks the tests, and runs the synthetic test suite. The initial extraction passed 66 synthetic tests. That is a regression-test result, not exhaustive catalog or human-difficulty validation.

## Tile-link quickstart

After building, run this CommonJS snippet from the package root, or save it there as `example.cjs` and run `node example.cjs`:

```js
const assert = require('node:assert/strict');
const { link } = require('./dist');
const level = link.linkLevel(1);
const generated = link.generateBoard(level, level.seed);
const session = new link.LinkSession(level.id, level.seed);
for (const pair of generated.solution) {
  assert.ok(session.act({ type: 'pair', a: pair.a, b: pair.b }));
}
assert.equal(session.snapshot().status, 'won');
const restored = link.LinkSession.restore(session.getReplay());
assert.deepEqual(restored.snapshot(), session.snapshot());
console.log('Tile-link cleared and replayed.');
```

## Match-3 quickstart

```js
const assert = require('node:assert/strict');
const { match3 } = require('./dist');
const session = new match3.LevelSession(match3.getLevel(1));
const move = session.model.findMoves()[0];
assert.ok(move);
assert.equal(session.swap(move.a, move.b).valid, true);
const data = new Map();
const storage = {
  getItem: key => data.get(key) ?? null,
  setItem: (key, value) => { data.set(key, value); }
};
const save = new match3.RoundSave(storage, 'local-player');
assert.equal(save.save(session, {
  runId: 'example', accountId: 'local-player', startedAt: 1
}), true);
const restored = save.read();
assert.ok(restored);
assert.deepEqual(restored.session.model.snapshot(), session.model.snapshot());
console.log(session.snapshot());
```

`accountId` is a caller-supplied local profile label, not an authenticated account. The example performs no network requests.

## Scope and limits

- Tile-link generation supplies a full construction witness for its generated board. `findPairs` finds currently legal pairs; it is not a general solver for arbitrary custom boards.
- Match-3 `playVisible` is a deterministic heuristic player using visible-board features. It is not a universal solver, a proof every level is winnable, or a promise about human difficulty.
- Level IDs range from 1 to 1,000,000. Current match-3 levels 101–1000 use 900 seed templates, reused in balanced cycles for later IDs. The range does not imply one million unique boards.
- Replay and progress storage are local convenience features, not anti-cheat, authentication, or server authority. Cap untrusted input sizes, action counts, and expanded repeat counts before calling replay APIs. Repeated link shuffles can be expensive.
- Validate custom boards and level definitions at your application boundary. The library does not comprehensively validate every malformed input or enforce your resource budgets.
- Storage keys use `puzzle-engine.*`. Existing application stores are not read automatically; migration is the caller's responsibility.

See [rules](docs/RULES.md), [versions and replay compatibility](docs/VERSIONS.md), and [third-party notices](THIRD_PARTY_NOTICES.md).

RoundSave supports catalog definitions with generated initial boards only. It rejects custom initial boards and altered numeric level definitions with problem `invalid`; use a separate application save format for custom sessions. Historical v2/v3 seed overrides remain supported.

## Validation report

The current catalog exercise checked 1,004 cases per engine. Every tile-link construction witness cleared its board; every match-3 run reproduced its actions and saves exactly. The single match-3 heuristic won 633 and lost 371 runs, so this is not a universal solvability claim. See [validation scope and results](docs/VALIDATION.md).
