# Third-party notices and provenance

## Project source

This package is extracted from a pre-existing TypeScript implementation supplied by the maintainer. See the project `LICENSE` for the MIT license grant and named copyright holder.

Earlier implementation work referenced older source. This statement records provenance only: it does not establish the ownership or license of those references, grant rights to them, or incorporate them into this distribution. No reference source archives, unidentified third-party files, Cocos runtime, game assets, customer UI, audio, branding, backend services, or credentials are bundled. If further incorporated third-party material is identified, resolve its rights and preserve its required notices before distribution.

## Development dependencies

There are no runtime npm dependencies. The lockfile pins development tooling:

- **TypeScript 5.4.5**: Apache License 2.0. Upstream: https://github.com/microsoft/TypeScript . License: `node_modules/typescript/LICENSE.txt` after installation.
- **@types/node 22.20.5**: MIT License. Upstream: https://github.com/DefinitelyTyped/DefinitelyTyped . License: `node_modules/@types/node/LICENSE` after installation.
- **undici-types 6.21.0**: MIT License, a transitive dependency of `@types/node`; consult `package-lock.json` for the exact version. Upstream: https://github.com/nodejs/undici . License: `node_modules/undici-types/LICENSE` after installation.

These dependencies retain their own licenses. `node_modules` is not part of the intended source distribution. If redistributing dependency files or tooling, include their applicable upstream license and notice files. This summary does not replace those texts.

Cocos Creator 3.8.3 describes the former application's integration version only. No Cocos code is included, and this package does not grant rights to Cocos software or associated trademarks.
