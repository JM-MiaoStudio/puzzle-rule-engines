# Versions and compatibility

## Package wrapper

`ENGINE_VERSION` and the package version are **0.1.0**. This is the first isolated package wrapper, not the first version of the underlying rules. The source was extracted from a pre-existing implementation. The former Cocos Creator **3.8.3** integration is excluded; this package requires no Cocos runtime.

The source package is distributed under the MIT License. Versioned rule identifiers below remain separate from the package version.

## Tile-link rules

- `link.2026-11-04.v1`: legacy replay definitions, IDs 1–10, four tile kinds.
- `link.2026-11-04.v2`: expanded base definitions, IDs 1–20, historical tile-kind counts.
- `link.2026-11-04.v3`: base definitions, IDs 1–20, revised tile-kind counts.
- `link.2026-11-04.v4`: current default, IDs 1–1,000,000, including generated definitions after ID 20.

`linkLevel` validates each version's supported ID range. `LinkSession.restore` accepts these four exact version identifiers and rejects unknown versions. Replay supports legacy flat actions and compressed repeats. Keep the original rule version and seed when storing a replay.

## Match-3 level rules

- `2026-11-04.v2`: legacy tutorial definitions, IDs 1–10 only.
- `2026-11-04.v3`: previous generated catalog rules.
- `2026-11-05.v4`: current default, with the quality-seed template selection after ID 100.

The current numeric ID limit is 1,000,000. There are 900 current seed templates for IDs 101–1000, reused in balanced cycles after ID 1000. This does not represent one million independently authored or unique boards. `CERTIFIED_LEVEL_COUNT` and related historical certification/provenance labels are retained implementation metadata, not evidence that this extracted package has freshly revalidated every catalog entry.

`RoundSave` accepts the three listed versions and preserves the saved rule version. Current-version saves require the catalog seed for their level. Unknown versions are reported as outdated; malformed records are invalid. The save format's `version: 1` is separate from the rules version.

## Extraction changes

- Added `link` and `match3` root namespaces and a CommonJS/declaration build.
- Removed application integration, presentation assets, backend and reward-related context.
- Changed local storage keys to `puzzle-engine.*`; migration from earlier application keys is not automatic.
- Renamed the campaign merge API to `mergeCompleted`; it makes no server-authority claim.
- Restricted saved round context to local profile and round metadata.
- Neutralized descriptive labels while retaining numeric rule definitions and seed tables.

The initial extraction passed 66 synthetic regression tests. Tests cover selected behavior, replay, storage, and deterministic generation; they do not establish universal solvability or human difficulty. Any later catalog audit must report its actual scope and results separately rather than treating historical constants as a new certificate.

RoundSave supports catalog definitions with generated initial boards only. It rejects custom initial boards and altered numeric level definitions with problem `invalid`; use a separate application save format for custom sessions. Historical v2/v3 seed overrides remain supported.

`MATCH3_QUALITY_PROVENANCE.coreFingerprint` and `catalogFingerprint` describe the historical implementation/catalog, not a hash of this extracted package. Current release content is identified by its Git commit.
