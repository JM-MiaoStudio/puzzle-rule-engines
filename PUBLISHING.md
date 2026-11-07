# Publication checklist

LICENSE names JM-MiaoStudio as the copyright holder. This is a clean source extraction with no original application Git history.

- Verify npm ci --ignore-scripts and npm run verify.
- Review the scope and results of npm run test:catalog.
- Audit only the explicit source-tree allowlist; never add node_modules, build caches, source archives, original application folders, assets, credentials or business databases.
- Publish to the verified JM-MiaoStudio/puzzle-rule-engines repository and verify the exact remote commit and CI result.
- Keep private: true in package metadata: GitHub source publication does not request or authorize publishing to the npm registry.
- Recheck third-party rights/notices if additional material is later incorporated.
