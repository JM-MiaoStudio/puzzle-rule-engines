# Validation

## Reproduce

Use Node.js 22.14 or later, run npm ci --ignore-scripts, then npm run verify. The full synthetic catalog exercise is npm run test:catalog; it is intentionally separate from ordinary CI because generation and repeated restoration are comparatively expensive.

## Regression suite

The final local build and typecheck passed, and all 66 synthetic tests passed on Node.js v24.16.0. Coverage includes all 512 occupancy masks of a 3x3 link-board oracle comparison, generated witnesses, shuffle conservation, invalid actions, long compressed replay, special match combinations, deterministic replay, move/goal budgets, storage failure recovery, and catalog-only save boundaries. Read-only review independently checked the save-boundary regression tests.

## Catalog run

Machine-readable results: [catalog-summary.json](../verification/catalog-summary.json).

- IDs: 1 through 1000, plus 1001, 10000, 999999 and 1000000, for each engine.
- Tile-link: 1004 generated boards; 39345 witness pairs passed an independent corner-enumeration oracle. Every witness cleared the board. Mid-round and terminal restoration matched the live state.
- Match-3: 1004 legal heuristic runs replayed with identical goals and terminal status, with exact mid-round and terminal model/save restoration. The visible-board special policy with tie seed 1 won 633 runs and lost 371. A heuristic loss is not a failed replay check and does not prove that the level is impossible.
- These are synthetic checks, not human difficulty, visual, audio, Cocos, WeChat, device, anti-cheat, or service-integration acceptance tests.
- IDs above 1000 repeat the 900 high-stage match-3 templates. No claim of one million unique boards or exhaustive testing of every allowed ID is made.

Catalog models and numerical definitions were unchanged by the final local-save guard. The guard's rejection of unsupported custom boards/definitions was separately checked in the final 66-test suite.

## Content audit

The publication tree contains only source, synthetic tests, documentation, workflow/configuration and synthetic verification summaries. No assets, media, source archives, original Git history, credentials, customer branding, endpoints, accounts, reward services or business data are included. Pattern scanning and code review found no included customer markers or credential patterns; these checks are not proof that no future issue exists. Runtime source fingerprints are in [source-manifest.json](../verification/source-manifest.json).

The npm packaging dry-run contained no bundled dependencies. The package retains private: true so GitHub source publication does not implicitly publish it to the npm registry.
