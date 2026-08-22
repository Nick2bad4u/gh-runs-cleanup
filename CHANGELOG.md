<!-- markdownlint-disable -->
<!-- eslint-disable markdown/no-missing-label-refs -->

# 📜 Changelog

## ✨ What's Changed

- <b>Commit Range: ➡️</b> [`v2.0.0...dffd5d0`](https://github.com/Nick2bad4u/gh-runs-cleanup/compare/v2.0.0...dffd5d0a2a6ee55d2cf4a1ddf038ae3a0db67a4c "View full commit range on GitHub")

### 🛠️ Bug Fixes

- [`321f6f6`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/321f6f658df11e99f7f894f2dff4c567e812bfe0 "Diff: 3 files, +20 | -20") — 🐛 [fix] Run packaged extension through explicit entrypoint&nbsp;<sub><em>(3&nbsp;files,&nbsp;+20,&nbsp;-20)</em></sub>
  - Remove import-time execution from the CLI module and make both source and SEA wrappers call runCli explicitly.
  - Regression-test native assets with GitHub CLI's alternate argv0 semantics so an extension cannot silently exit again.

### 📝 Documentation

- [`5665ee2`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/5665ee2cb9a2833d7aaf1c222b4ff6d3e1224ae6 "Diff: 1 file, +11 | -1") — 📝 [docs] Refresh entrypoint repair changelog&nbsp;<sub><em>(1&nbsp;file,&nbsp;+11,&nbsp;-1)</em></sub>
  - Include the direct runCli regression test in the formatter-stable unreleased history.

- [`6c4ec96`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/6c4ec9641c3542bad3b37cd0d12a3fdf48fe35e7 "Diff: 1 file, +19 | -1") — 📝 [docs] Document packaged entrypoint repair&nbsp;<sub><em>(1&nbsp;file,&nbsp;+19,&nbsp;-1)</em></sub>
  - Regenerate the unreleased changelog from v2.0.0 through the explicit-entrypoint fix and preserve the published v2.0.0 history.

### 🎨 Styling

- [`8fb4f6b`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/8fb4f6b441a65f808ca7813dc061f532716035fc "Diff: 1 file, +5 | -1") — 🎨 [style] Format executable wrapper test&nbsp;<sub><em>(1&nbsp;file,&nbsp;+5,&nbsp;-1)</em></sub>
  - Apply the repository Prettier output to the new process-state regression case so Linux CI matches the local release gate.

### 🧪 Testing

- [`5d07642`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/5d076425500d0fbbdc673884df837d9993d8daf8 "Diff: 1 file, +21 | -1") — ✅ [test] Cover executable CLI wrapper&nbsp;<sub><em>(1&nbsp;file,&nbsp;+21,&nbsp;-1)</em></sub>
  - Invoke runCli with controlled process arguments, assert help output and exit status, and restore argv and exit state after the regression check.

### 👷 CI/CD

- [`dffd5d0`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/dffd5d0a2a6ee55d2cf4a1ddf038ae3a0db67a4c "Diff: 1 file, +7 | -0") — 👷 [ci] Make package metadata lint deterministic&nbsp;<sub><em>(1&nbsp;file,&nbsp;+7,&nbsp;-0)</em></sub>
  - Stop the general JSON-schema rule from fetching SchemaStore for package.json and keep validation on the dedicated npm-package-json-lint gate, avoiding remote reference failures.

## ✨ What's Changed in v2.0.0

- <b>Commit Range: ➡️</b> [`v1.0.1...v2.0.0`](https://github.com/Nick2bad4u/gh-runs-cleanup/compare/v1.0.1...v2.0.0 "View full commit range on GitHub")

### 🛠️ Bug Fixes

- [`6cc9eba`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/6cc9eba62744f714d0ae768eb79f12fc27093293 "Diff: 5 files, +46 | -7") — 🐛 [fix] Stabilize generated changelog formatting&nbsp;<sub><em>(5&nbsp;files,&nbsp;+46,&nbsp;-7)</em></sub>
  - Render Dependabot brackets as formatter-stable HTML entities and converge Prettier output to a verified fixed point before writing CHANGELOG.md.
  - Keep the convergence loop bounded, linted through a narrowly scoped sequential-await exception, and covered by the existing normalization tests.

### 🚜 Refactor

- [`ecf5905`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/ecf59058637cb65ba0a96db472aafb50a503652d "Diff: 49 files, +13455 | -18078") — 🚜 [refactor] Modernize CLI safety and release verification (#13)&nbsp;<sub><em>(49&nbsp;files,&nbsp;+13455,&nbsp;-18078)</em></sub>
  - 🚜 [refactor] Modernize CLI safety and release verification

- [`4d5a863`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/4d5a863af52fcfd27a6b555c3053d822c0f4553e "Diff: 46 files, +11878 | -18076") — 🚜 [refactor] Modernize CLI safety and release verification&nbsp;<sub><em>(46&nbsp;files,&nbsp;+11878,&nbsp;-18076)</em></sub>
  - 🐛 [fix] Harden repository targeting, numeric parsing, run normalization, filtering, retry handling, structured errors, table rendering, and unknown-age exclusion so destructive selections fail safely.
  - 🚜 [refactor] Run the TypeScript source natively with explicit import extensions, remove stale emitted JavaScript siblings, and keep compiled output compatible with supported Node releases.
  - 🧪 [test] Migrate the behavioral suite to Vitest with V8 coverage, add 70 focused CLI, GitHub boundary, output, and terminal tests, and enforce 90% coverage thresholds.
  - 👷 [ci] Make lint, typecheck, coverage, build, native asset smoke tests, Codecov OIDC upload, checksum generation, and immutable staging checks mandatory release gates.
  - 🔒️ [chore] Adopt npm 12 exact install-script approvals, zero-vulnerability dependency updates, current pinned actions, shared secret scanning policy, Codeowners, Gitleaks, CodeQL, and Sonar/Codecov configuration.
  - 🎨 [style] Modernize the static site CSS and HTML for logical properties, responsive rendering, accessible metadata, and synchronized Node requirements.
  - 🔨 [build] Add durable changelog normalization and npm refresh helpers for generated Markdown and nested npm 12 policy compatibility.

### 📝 Documentation

- [`7ceb958`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/7ceb9588ba7057a5bb9f2cc776af652d96812aee "Diff: 1 file, +1551 | -0") — 📝 [docs] Add generated repository changelog&nbsp;<sub><em>(1&nbsp;file,&nbsp;+1551,&nbsp;-0)</em></sub>
  - 📝 [docs] Capture the complete change history since v1.0.1, including the CLI safety modernization and release hardening commit.
  - 🔨 [build] Normalize Dependabot-style bracket prefixes so generated entries remain valid Markdown and link checks do not interpret dependency scopes as local paths.

### 🧹 Chores

- [`da0e960`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/da0e960b98950b316476603507e1d244b15a6cc5 "Diff: 2 files, +3 | -3") — Release v2.0.0&nbsp;<sub><em>(2&nbsp;files,&nbsp;+3,&nbsp;-3)</em></sub>

- [`0cd2b01`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/0cd2b019de2a10489fbaa7b698ceb60c12f43a83 "Diff: 1 file, +13 | -13") — _(tooling)_ Run package CLIs through npx&nbsp;<sub><em>(1&nbsp;file,&nbsp;+13,&nbsp;-13)</em></sub>
  - Apply the local package-script migration so mapped package CLIs resolve through npx, while standardizing Actionlint configuration and removing redundant wrappers where applicable.

- [`deb2a6d`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/deb2a6db268ffa765cd0ae9cb7a9eec32cff6f6a "Diff: 34 files, +28426 | -2826") — _(tooling)_ Adopt shared package configs&nbsp;<sub><em>(34&nbsp;files,&nbsp;+28426,&nbsp;-2826)</em></sub>
  - Migrate lint, formatting, documentation, and dependency tooling to the maintained shared presets.
  - Preserve the GitHub CLI extension behavior while keeping heavyweight duplicate and link checks outside lint:all.

### 👷 CI/CD

- [`8fab51a`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/8fab51a530f090f84c7b4bd070fd71e13a5fa895 "Diff: 3 files, +27 | -4") — 💚 [ci] Make TOML formatting platform-independent&nbsp;<sub><em>(3&nbsp;files,&nbsp;+27,&nbsp;-4)</em></sub>
  - 🔧 [chore] Add a repository-scoped Tombi configuration so local user preferences cannot change lint output across Windows and Linux.
  - 🎨 [style] Reformat the Gitleaks configuration with the project-owned Tombi rules and leave TOML ownership out of Prettier.

- [`f765d3b`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/f765d3b69cdce773c865cda68e8f3be72572040b "Diff: 2 files, +121 | -120") — 💚 [ci] Keep generated changelog formatting stable&nbsp;<sub><em>(2&nbsp;files,&nbsp;+121,&nbsp;-120)</em></sub>
  - 🎨 [style] Apply Prettier's canonical table alignment to the generated changelog so the remote formatting gate matches local generation.
  - 🔨 [build] Add a dedicated changelog formatter and run it automatically after normalization to prevent the generated artifact from regressing CI.

- [`e64f7fc`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/e64f7fce1b3fef5064dd86fa99e316a9ace1781d "Diff: 1 file, +3 | -2") — 👷 [ci] Bound Dependabot npm updates&nbsp;<sub><em>(1&nbsp;file,&nbsp;+3,&nbsp;-2)</em></sub>

- [`7eb04b8`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/7eb04b8dcbe8bd56fe2468c6370dd87783dbbf44 "Diff: 1 file, +1 | -1") — Update Dependabot auto-merge workflow pin&nbsp;<sub><em>(1&nbsp;file,&nbsp;+1,&nbsp;-1)</em></sub>

- [`9b9283c`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/9b9283cc373b15b8a092ee85eee23ab45434473d "Diff: 8 files, +72 | -13") — Add Dependabot auto-merge workflow&nbsp;<sub><em>(8&nbsp;files,&nbsp;+72,&nbsp;-13)</em></sub>

### 📦 Dependencies

- [`c12a2fc`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/c12a2fc91e883b9a9ef48b6d23afdc86b55b46c2 "Diff: 1 file, +10 | -10") — ⬆️ [build] Update npm_and_yarn dependencies&nbsp;<sub><em>(1&nbsp;file,&nbsp;+10,&nbsp;-10)</em></sub>

- [`91f7f31`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/91f7f31864e1068ee956cb36f9b980761085fb89 "Diff: 1 file, +9 | -9") — ⬆️ [build] Update npm_and_yarn dependencies&nbsp;<sub><em>(1&nbsp;file,&nbsp;+9,&nbsp;-9)</em></sub>

- [`d3e23e7`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/d3e23e73c646a87a93e6bb20d09a3347c49adb95 "Diff: 1 file, +16 | -32") — ⬆️ [build] Update npm_and_yarn dependencies&nbsp;<sub><em>(1&nbsp;file,&nbsp;+16,&nbsp;-32)</em></sub>

- [`a28e779`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/a28e77919d7c6a34f347792e649fa72ca8307ea7 "Diff: 6 files, +239 | -171") — _(deps)_ [dependency] Update dependency group&nbsp;<sub><em>(6&nbsp;files,&nbsp;+239,&nbsp;-171)</em></sub>
  - Bumps the dependabot-all group with 2 updates: [actions/checkout](https://github.com/actions/checkout) and [softprops/action-gh-release](https://github.com/softprops/action-gh-release).
  - Updates `actions/checkout` from 6.0.3 to 7.0.0
- [Release notes](https://github.com/actions/checkout/releases)
- [Changelog](https://github.com/actions/checkout/blob/main/CHANGELOG.md)
- [Commits](https://github.com/actions/checkout/compare/df4cb1c069e1874edd31b4311f1884172cec0e10...9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0)
  - Updates `softprops/action-gh-release` from 3.0.0 to 3.0.1
- [Release notes](https://github.com/softprops/action-gh-release/releases)
- [Changelog](https://github.com/softprops/action-gh-release/blob/master/CHANGELOG.md)
- [Commits](https://github.com/softprops/action-gh-release/compare/b4309332981a82ec1c5618f44dd2e27cc8bfbfda...718ea10b132b3b2eba29c1007bb80653f286566b)
  &#91;dependabot&#93;&#91;all&#93;(deps): [dependency] Update dependency group
  - Bumps the dependabot-all group with 35 updates:
  - | Package                                                                                                                             | From      | To        |
    | ----------------------------------------------------------------------------------------------------------------------------------- | --------- | --------- |
    | [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/node)                                              | `25.9.3`  | `26.0.1`  |
    | [eslint](https://github.com/eslint/eslint)                                                                                          | `10.4.1`  | `10.6.0`  |
    | [globals](https://github.com/sindresorhus/globals)                                                                                  | `17.6.0`  | `17.7.0`  |
    | [prettier](https://github.com/prettier/prettier)                                                                                    | `3.8.3`   | `3.9.1`   |
    | [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/typescript-eslint)                    | `8.61.0`  | `8.62.0`  |
    | [@augment-vir/assert](https://github.com/electrovir/augment-vir)                                                                    | `31.73.0` | `31.73.2` |
    | [@augment-vir/common](https://github.com/electrovir/augment-vir)                                                                    | `31.73.0` | `31.73.2` |
    | [@augment-vir/core](https://github.com/electrovir/augment-vir)                                                                      | `31.73.0` | `31.73.2` |
    | [@date-vir/duration](https://github.com/electrovir/date-vir)                                                                        | `8.3.2`   | `8.6.1`   |
    | [@reteps/dockerfmt](https://github.com/reteps/dockerfmt/tree/HEAD/js)                                                               | `0.5.2`   | `0.5.4`   |
    | [@types/estree](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/estree)                                          | `1.0.8`   | `1.0.9`   |
    | [@types/luxon](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/luxon)                                            | `3.7.1`   | `3.7.2`   |
    | [@typescript-eslint/eslint-plugin](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/eslint-plugin)         | `8.61.0`  | `8.62.0`  |
    | [@typescript-eslint/parser](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/parser)                       | `8.61.0`  | `8.62.0`  |
    | [@typescript-eslint/project-service](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/project-service)     | `8.61.0`  | `8.62.0`  |
    | [@typescript-eslint/scope-manager](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/scope-manager)         | `8.61.0`  | `8.62.0`  |
    | [@typescript-eslint/tsconfig-utils](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/tsconfig-utils)       | `8.61.0`  | `8.62.0`  |
    | [@typescript-eslint/type-utils](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/type-utils)               | `8.61.0`  | `8.62.0`  |
    | [@typescript-eslint/types](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/types)                         | `8.61.0`  | `8.62.0`  |
    | [@typescript-eslint/typescript-estree](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/typescript-estree) | `8.61.0`  | `8.62.0`  |
    | [@typescript-eslint/utils](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/utils)                         | `8.61.0`  | `8.62.0`  |
    | [@typescript-eslint/visitor-keys](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/visitor-keys)           | `8.61.0`  | `8.62.0`  |
    | [acorn](https://github.com/acornjs/acorn)                                                                                           | `8.16.0`  | `8.17.0`  |
    | [brace-expansion](https://github.com/juliangruber/brace-expansion)                                                                  | `5.0.5`   | `5.0.7`   |
    | [comment-parser](https://github.com/yavorskiy/comment-parser)                                                                       | `1.4.6`   | `1.4.7`   |
    | [deepcopy-esm](https://github.com/electrovir/deepcopy-esm)                                                                          | `2.1.1`   | `2.1.2`   |
    | [expect-type](https://github.com/mmkal/expect-type)                                                                                 | `1.3.0`   | `1.4.0`   |
    | [proxy-vir](https://github.com/electrovir/proxy-vir)                                                                                | `2.0.2`   | `2.0.3`   |
    | [semver](https://github.com/npm/node-semver)                                                                                        | `7.7.4`   | `7.8.5`   |
    | [sort-package-json](https://github.com/keithamus/sort-package-json)                                                                 | `3.6.1`   | `3.7.1`   |
    | [sql-formatter](https://github.com/sql-formatter-org/sql-formatter)                                                                 | `15.7.3`  | `15.8.2`  |
    | [tinyglobby](https://github.com/SuperchupuDev/tinyglobby)                                                                           | `0.2.16`  | `0.2.17`  |
    | [type-fest](https://github.com/sindresorhus/type-fest)                                                                              | `5.6.0`   | `5.7.0`   |
    | [typed-event-target](https://github.com/electrovir/typed-event-target)                                                              | `4.3.0`   | `4.3.1`   |
    | [undici-types](https://github.com/nodejs/undici)                                                                                    | `7.24.6`  | `8.3.0`   |
  - Updates `@types/node` from 25.9.3 to 26.0.1
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/node)
  - Updates `eslint` from 10.4.1 to 10.6.0
- [Release notes](https://github.com/eslint/eslint/releases)
- [Commits](https://github.com/eslint/eslint/compare/v10.4.1...v10.6.0)
  - Updates `globals` from 17.6.0 to 17.7.0
- [Release notes](https://github.com/sindresorhus/globals/releases)
- [Commits](https://github.com/sindresorhus/globals/compare/v17.6.0...v17.7.0)
  - Updates `prettier` from 3.8.3 to 3.9.1
- [Release notes](https://github.com/prettier/prettier/releases)
- [Changelog](https://github.com/prettier/prettier/blob/main/CHANGELOG.md)
- [Commits](https://github.com/prettier/prettier/compare/3.8.3...3.9.1)
  - Updates `typescript-eslint` from 8.61.0 to 8.62.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/typescript-eslint/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.62.0/packages/typescript-eslint)
  - Updates `@augment-vir/assert` from 31.73.0 to 31.73.2
- [Release notes](https://github.com/electrovir/augment-vir/releases)
- [Commits](https://github.com/electrovir/augment-vir/compare/v31.73.0...v31.73.2)
  - Updates `@augment-vir/common` from 31.73.0 to 31.73.2
- [Release notes](https://github.com/electrovir/augment-vir/releases)
- [Commits](https://github.com/electrovir/augment-vir/compare/v31.73.0...v31.73.2)
  - Updates `@augment-vir/core` from 31.73.0 to 31.73.2
- [Release notes](https://github.com/electrovir/augment-vir/releases)
- [Commits](https://github.com/electrovir/augment-vir/compare/v31.73.0...v31.73.2)
  - Updates `@date-vir/duration` from 8.3.2 to 8.6.1
- [Release notes](https://github.com/electrovir/date-vir/releases)
- [Commits](https://github.com/electrovir/date-vir/compare/v8.3.2...v8.6.1)
  - Updates `@reteps/dockerfmt` from 0.5.2 to 0.5.4
- [Release notes](https://github.com/reteps/dockerfmt/releases)
- [Commits](https://github.com/reteps/dockerfmt/commits/v0.5.4/js)
  - Updates `@types/estree` from 1.0.8 to 1.0.9
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/estree)
  - Updates `@types/luxon` from 3.7.1 to 3.7.2
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/luxon)
  - Updates `@typescript-eslint/eslint-plugin` from 8.61.0 to 8.62.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.62.0/packages/eslint-plugin)
  - Updates `@typescript-eslint/parser` from 8.61.0 to 8.62.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/parser/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.62.0/packages/parser)
  - Updates `@typescript-eslint/project-service` from 8.61.0 to 8.62.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/project-service/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.62.0/packages/project-service)
  - Updates `@typescript-eslint/scope-manager` from 8.61.0 to 8.62.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/scope-manager/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.62.0/packages/scope-manager)
  - Updates `@typescript-eslint/tsconfig-utils` from 8.61.0 to 8.62.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/tsconfig-utils/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.62.0/packages/tsconfig-utils)
  - Updates `@typescript-eslint/type-utils` from 8.61.0 to 8.62.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/type-utils/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.62.0/packages/type-utils)
  - Updates `@typescript-eslint/types` from 8.61.0 to 8.62.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/types/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.62.0/packages/types)
  - Updates `@typescript-eslint/typescript-estree` from 8.61.0 to 8.62.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/typescript-estree/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.62.0/packages/typescript-estree)
  - Updates `@typescript-eslint/utils` from 8.61.0 to 8.62.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/utils/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.62.0/packages/utils)
  - Updates `@typescript-eslint/visitor-keys` from 8.61.0 to 8.62.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/visitor-keys/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.62.0/packages/visitor-keys)
  - Updates `acorn` from 8.16.0 to 8.17.0
- [Commits](https://github.com/acornjs/acorn/compare/8.16.0...8.17.0)
  - Updates `brace-expansion` from 5.0.5 to 5.0.7
- [Release notes](https://github.com/juliangruber/brace-expansion/releases)
- [Commits](https://github.com/juliangruber/brace-expansion/compare/v5.0.5...v5.0.7)
  - Updates `comment-parser` from 1.4.6 to 1.4.7
- [Changelog](https://github.com/syavorsky/comment-parser/blob/main/CHANGELOG.md)
- [Commits](https://github.com/yavorskiy/comment-parser/commits/v1.4.7)
  - Updates `deepcopy-esm` from 2.1.1 to 2.1.2
- [Release notes](https://github.com/electrovir/deepcopy-esm/releases)
- [Commits](https://github.com/electrovir/deepcopy-esm/compare/v2.1.1...v2.1.2)
  - Updates `expect-type` from 1.3.0 to 1.4.0
- [Release notes](https://github.com/mmkal/expect-type/releases)
- [Commits](https://github.com/mmkal/expect-type/compare/v1.3.0...v1.4.0)
  - Updates `proxy-vir` from 2.0.2 to 2.0.3
- [Release notes](https://github.com/electrovir/proxy-vir/releases)
- [Commits](https://github.com/electrovir/proxy-vir/compare/v2.0.2...v2.0.3)
  - Updates `semver` from 7.7.4 to 7.8.5
- [Release notes](https://github.com/npm/node-semver/releases)
- [Changelog](https://github.com/npm/node-semver/blob/main/CHANGELOG.md)
- [Commits](https://github.com/npm/node-semver/compare/v7.7.4...v7.8.5)
  - Updates `sort-package-json` from 3.6.1 to 3.7.1
- [Release notes](https://github.com/keithamus/sort-package-json/releases)
- [Commits](https://github.com/keithamus/sort-package-json/compare/v3.6.1...v3.7.1)
  - Updates `sql-formatter` from 15.7.3 to 15.8.2
- [Release notes](https://github.com/sql-formatter-org/sql-formatter/releases)
- [Commits](https://github.com/sql-formatter-org/sql-formatter/compare/v15.7.3...v15.8.2)
  - Updates `tinyglobby` from 0.2.16 to 0.2.17
- [Release notes](https://github.com/SuperchupuDev/tinyglobby/releases)
- [Changelog](https://github.com/SuperchupuDev/tinyglobby/blob/main/CHANGELOG.md)
- [Commits](https://github.com/SuperchupuDev/tinyglobby/compare/0.2.16...0.2.17)
  - Updates `type-fest` from 5.6.0 to 5.7.0
- [Release notes](https://github.com/sindresorhus/type-fest/releases)
- [Commits](https://github.com/sindresorhus/type-fest/compare/v5.6.0...v5.7.0)
  - Updates `typed-event-target` from 4.3.0 to 4.3.1
- [Release notes](https://github.com/electrovir/typed-event-target/releases)
- [Commits](https://github.com/electrovir/typed-event-target/compare/v4.3.0...v4.3.1)
  - Updates `undici-types` from 7.24.6 to 8.3.0
- [Release notes](https://github.com/nodejs/undici/releases)
- [Commits](https://github.com/nodejs/undici/compare/v7.24.6...v8.3.0)
  ***

updated-dependencies:

- dependency-name: actions/checkout
  dependency-version: 7.0.0
  dependency-type: direct:production
  update-type: version-update:semver-major
  dependency-group: dependabot-all
- dependency-name: softprops/action-gh-release
  dependency-version: 3.0.1
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: "@types/node"
  dependency-version: 26.0.1
  dependency-type: direct:development
  update-type: version-update:semver-major
  dependency-group: dependabot-all
- dependency-name: eslint
  dependency-version: 10.6.0
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: globals
  dependency-version: 17.7.0
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: prettier
  dependency-version: 3.9.1
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: typescript-eslint
  dependency-version: 8.62.0
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@augment-vir/assert"
  dependency-version: 31.73.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: "@augment-vir/common"
  dependency-version: 31.73.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: "@augment-vir/core"
  dependency-version: 31.73.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: "@date-vir/duration"
  dependency-version: 8.6.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@reteps/dockerfmt"
  dependency-version: 0.5.4
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: "@types/estree"
  dependency-version: 1.0.9
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: "@types/luxon"
  dependency-version: 3.7.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/eslint-plugin"
  dependency-version: 8.62.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/parser"
  dependency-version: 8.62.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/project-service"
  dependency-version: 8.62.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/scope-manager"
  dependency-version: 8.62.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/tsconfig-utils"
  dependency-version: 8.62.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/type-utils"
  dependency-version: 8.62.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/types"
  dependency-version: 8.62.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/typescript-estree"
  dependency-version: 8.62.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/utils"
  dependency-version: 8.62.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/visitor-keys"
  dependency-version: 8.62.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: acorn
  dependency-version: 8.17.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: brace-expansion
  dependency-version: 5.0.7
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: comment-parser
  dependency-version: 1.4.7
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: deepcopy-esm
  dependency-version: 2.1.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: expect-type
  dependency-version: 1.4.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: proxy-vir
  dependency-version: 2.0.3
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: semver
  dependency-version: 7.8.5
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: sort-package-json
  dependency-version: 3.7.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: sql-formatter
  dependency-version: 15.8.2
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: tinyglobby
  dependency-version: 0.2.17
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: type-fest
  dependency-version: 5.7.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: typed-event-target
  dependency-version: 4.3.1
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: undici-types
  dependency-version: 8.3.0
  dependency-type: indirect
  update-type: version-update:semver-major
  dependency-group: dependabot-all
  ...

- [`40729ce`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/40729ce543d04442cdf392655cc5dc29ee5023d8 "Diff: 2 files, +109 | -109") — Bump esbuild in the npm_and_yarn group across 1 directory&nbsp;<sub><em>(2&nbsp;files,&nbsp;+109,&nbsp;-109)</em></sub>
  - Bumps the npm_and_yarn group with 1 update in the / directory: [esbuild](https://github.com/evanw/esbuild).
  - Updates `esbuild` from 0.28.0 to 0.28.1
- [Release notes](https://github.com/evanw/esbuild/releases)
- [Changelog](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md)
- [Commits](https://github.com/evanw/esbuild/compare/v0.28.0...v0.28.1)
  ***

updated-dependencies:

- dependency-name: esbuild
  dependency-version: 0.28.1
  dependency-type: direct:development
  dependency-group: npm_and_yarn
  ...

### 🛡️ Security

- [`e6e518c`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/e6e518cc51ab631818f8d43c54114644bec11095 "Diff: 1 file, +33 | -5") — 📝 [docs] Refresh changelog for Sonar fixes&nbsp;<sub><em>(1&nbsp;file,&nbsp;+33,&nbsp;-5)</em></sub>
  - Regenerate the unreleased changelog through the formatter-stable pipeline so it includes the security, lint, and generation fixes with valid remote commit links.

- [`ae07a6c`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/ae07a6c8d837ef58df4b824d578f1fe747068a01 "Diff: 15 files, +530 | -180") — 🔒️ [fix] Resolve Sonar findings and harden script linting&nbsp;<sub><em>(15&nbsp;files,&nbsp;+530,&nbsp;-180)</em></sub>
  - Resolve GitHub CLI through trusted absolute paths, with an explicit absolute GH_PATH override for nonstandard installations.
  - Replace the changelog regex with a linear tested normalizer, simplify help and argument parsing, and use Sonar-compatible numeric constants.
  - Bring repository maintenance scripts under zero-warning linting while preserving the SEA build, dependency refresh, and Node-version synchronization behavior.

- [`c3c1620`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/c3c162005f25959e19f92edde293da25b8e7bd22 "Diff: 6 files, +19920 | -14540") — _(deps)_ [dependency] Update dependency group&nbsp;<sub><em>(6&nbsp;files,&nbsp;+19920,&nbsp;-14540)</em></sub>
  - Bumps the dependabot-all group with 6 updates:
  - | Package                                                                       | From     | To       |
    | ----------------------------------------------------------------------------- | -------- | -------- |
    | [step-security/harden-runner](https://github.com/step-security/harden-runner) | `2.19.4` | `2.20.0` |
    | [actions/checkout](https://github.com/actions/checkout)                       | `7.0.0`  | `7.0.1`  |
    | [actions/setup-node](https://github.com/actions/setup-node)                   | `6.4.0`  | `7.0.0`  |
    | [github/codeql-action/init](https://github.com/github/codeql-action)          | `4.36.2` | `4.37.3` |
    | [github/codeql-action/analyze](https://github.com/github/codeql-action)       | `4.36.2` | `4.37.3` |
    | [softprops/action-gh-release](https://github.com/softprops/action-gh-release) | `3.0.1`  | `3.0.2`  |
  - Updates `step-security/harden-runner` from 2.19.4 to 2.20.0
- [Release notes](https://github.com/step-security/harden-runner/releases)
- [Commits](https://github.com/step-security/harden-runner/compare/9af89fc71515a100421586dfdb3dc9c984fbf411...bf7454d06d71f1098171f2acdf0cd4708d7b5920)
  - Updates `actions/checkout` from 7.0.0 to 7.0.1
- [Release notes](https://github.com/actions/checkout/releases)
- [Changelog](https://github.com/actions/checkout/blob/main/CHANGELOG.md)
- [Commits](https://github.com/actions/checkout/compare/9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0...3d3c42e5aac5ba805825da76410c181273ba90b1)
  - Updates `actions/setup-node` from 6.4.0 to 7.0.0
- [Release notes](https://github.com/actions/setup-node/releases)
- [Commits](https://github.com/actions/setup-node/compare/48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e...820762786026740c76f36085b0efc47a31fe5020)
  - Updates `github/codeql-action/init` from 4.36.2 to 4.37.3
- [Release notes](https://github.com/github/codeql-action/releases)
- [Changelog](https://github.com/github/codeql-action/blob/main/CHANGELOG.md)
- [Commits](https://github.com/github/codeql-action/compare/8aad20d150bbac5944a9f9d289da16a4b0d87c1e...e4fba868fa4b1b91e1fdab776edc8cfbe6e9fb81)
  - Updates `github/codeql-action/analyze` from 4.36.2 to 4.37.3
- [Release notes](https://github.com/github/codeql-action/releases)
- [Changelog](https://github.com/github/codeql-action/blob/main/CHANGELOG.md)
- [Commits](https://github.com/github/codeql-action/compare/8aad20d150bbac5944a9f9d289da16a4b0d87c1e...e4fba868fa4b1b91e1fdab776edc8cfbe6e9fb81)
  - Updates `softprops/action-gh-release` from 3.0.1 to 3.0.2
- [Release notes](https://github.com/softprops/action-gh-release/releases)
- [Changelog](https://github.com/softprops/action-gh-release/blob/master/CHANGELOG.md)
- [Commits](https://github.com/softprops/action-gh-release/compare/718ea10b132b3b2eba29c1007bb80653f286566b...3d0d9888cb7fd7b750713d6e236d1fcb99157228)
  &#91;dependabot&#93;&#91;dev&#93;&#91;all&#93;(deps-dev): [dependency] Update dependency group
  - Bumps the dependabot-all group with 13 updates:
  - | Package                                                                                                          | From      | To        |
    | ---------------------------------------------------------------------------------------------------------------- | --------- | --------- |
    | [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/node)                           | `26.1.1`  | `26.1.2`  |
    | [eslint](https://github.com/eslint/eslint)                                                                       | `10.7.0`  | `10.8.0`  |
    | [eslint-config-nick2bad4u](https://github.com/Nick2bad4u/eslint-config-nick2bad4u)                               | `5.0.0`   | `11.0.1`  |
    | [gitcliff-config-nick2bad4u](https://github.com/Nick2bad4u/gitcliff-config-nick2bad4u)                           | `1.3.0`   | `1.4.0`   |
    | [globals](https://github.com/sindresorhus/globals)                                                               | `17.7.0`  | `17.8.0`  |
    | [jscpd](https://github.com/kucherenko/jscpd/tree/HEAD/rust/jscpd)                                                | `5.0.12`  | `5.0.14`  |
    | [ncu-config-nick2bad4u](https://github.com/Nick2bad4u/ncu-config-nick2bad4u)                                     | `0.2.0`   | `0.2.1`   |
    | [npm-check-updates](https://github.com/raineorshine/npm-check-updates)                                           | `22.2.9`  | `23.0.0`  |
    | [prettier](https://github.com/prettier/prettier)                                                                 | `3.9.5`   | `3.9.6`   |
    | [secretlint](https://github.com/secretlint/secretlint)                                                           | `13.0.2`  | `13.0.4`  |
    | [stylelint](https://github.com/stylelint/stylelint)                                                              | `17.14.0` | `17.14.1` |
    | [typescript](https://github.com/microsoft/TypeScript)                                                            | `6.0.3`   | `7.0.2`   |
    | [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/typescript-eslint) | `8.63.0`  | `8.65.0`  |
  - Updates `@types/node` from 26.1.1 to 26.1.2
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/node)
  - Updates `eslint` from 10.7.0 to 10.8.0
- [Release notes](https://github.com/eslint/eslint/releases)
- [Commits](https://github.com/eslint/eslint/compare/v10.7.0...v10.8.0)
  - Updates `eslint-config-nick2bad4u` from 5.0.0 to 11.0.1
- [Release notes](https://github.com/Nick2bad4u/eslint-config-nick2bad4u/releases)
- [Changelog](https://github.com/Nick2bad4u/eslint-config-nick2bad4u/blob/main/CHANGELOG.md)
- [Commits](https://github.com/Nick2bad4u/eslint-config-nick2bad4u/compare/v5.0.0...v11.0.1)
  - Updates `gitcliff-config-nick2bad4u` from 1.3.0 to 1.4.0
- [Release notes](https://github.com/Nick2bad4u/gitcliff-config-nick2bad4u/releases)
- [Commits](https://github.com/Nick2bad4u/gitcliff-config-nick2bad4u/compare/v1.3.0...v1.4.0)
  - Updates `globals` from 17.7.0 to 17.8.0
- [Release notes](https://github.com/sindresorhus/globals/releases)
- [Commits](https://github.com/sindresorhus/globals/compare/v17.7.0...v17.8.0)
  - Updates `jscpd` from 5.0.12 to 5.0.14
- [Release notes](https://github.com/kucherenko/jscpd/releases)
- [Changelog](https://github.com/kucherenko/jscpd/blob/master/CHANGELOG.md)
- [Commits](https://github.com/kucherenko/jscpd/commits/v5.0.14/rust/jscpd)
  - Updates `ncu-config-nick2bad4u` from 0.2.0 to 0.2.1
- [Release notes](https://github.com/Nick2bad4u/ncu-config-nick2bad4u/releases)
- [Changelog](https://github.com/Nick2bad4u/ncu-config-nick2bad4u/blob/main/CHANGELOG.md)
- [Commits](https://github.com/Nick2bad4u/ncu-config-nick2bad4u/compare/v0.2.0...v0.2.1)
  - Updates `npm-check-updates` from 22.2.9 to 23.0.0
- [Release notes](https://github.com/raineorshine/npm-check-updates/releases)
- [Changelog](https://github.com/raineorshine/npm-check-updates/blob/main/CHANGELOG.md)
- [Commits](https://github.com/raineorshine/npm-check-updates/compare/v22.2.9...v23.0.0)
  - Updates `prettier` from 3.9.5 to 3.9.6
- [Release notes](https://github.com/prettier/prettier/releases)
- [Changelog](https://github.com/prettier/prettier/blob/main/CHANGELOG.md)
- [Commits](https://github.com/prettier/prettier/compare/3.9.5...3.9.6)
  - Updates `secretlint` from 13.0.2 to 13.0.4
- [Release notes](https://github.com/secretlint/secretlint/releases)
- [Commits](https://github.com/secretlint/secretlint/compare/v13.0.2...v13.0.4)
  - Updates `stylelint` from 17.14.0 to 17.14.1
- [Release notes](https://github.com/stylelint/stylelint/releases)
- [Changelog](https://github.com/stylelint/stylelint/blob/main/CHANGELOG.md)
- [Commits](https://github.com/stylelint/stylelint/compare/17.14.0...17.14.1)
  - Updates `typescript` from 6.0.3 to 7.0.2
- [Release notes](https://github.com/microsoft/TypeScript/releases)
- [Commits](https://github.com/microsoft/TypeScript/commits)
  - Updates `typescript-eslint` from 8.63.0 to 8.65.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/typescript-eslint/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.65.0/packages/typescript-eslint)
  ***

updated-dependencies:

- dependency-name: step-security/harden-runner
  dependency-version: 2.20.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: actions/checkout
  dependency-version: 7.0.1
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: actions/setup-node
  dependency-version: 7.0.0
  dependency-type: direct:production
  update-type: version-update:semver-major
  dependency-group: dependabot-all
- dependency-name: github/codeql-action/init
  dependency-version: 4.37.3
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: github/codeql-action/analyze
  dependency-version: 4.37.3
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: softprops/action-gh-release
  dependency-version: 3.0.2
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: "@types/node"
  dependency-version: 26.1.2
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: eslint
  dependency-version: 10.8.0
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: eslint-config-nick2bad4u
  dependency-version: 11.0.1
  dependency-type: direct:development
  update-type: version-update:semver-major
  dependency-group: dependabot-all
- dependency-name: gitcliff-config-nick2bad4u
  dependency-version: 1.4.0
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: globals
  dependency-version: 17.8.0
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: jscpd
  dependency-version: 5.0.14
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: ncu-config-nick2bad4u
  dependency-version: 0.2.1
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: npm-check-updates
  dependency-version: 23.0.0
  dependency-type: direct:development
  update-type: version-update:semver-major
  dependency-group: dependabot-all
- dependency-name: prettier
  dependency-version: 3.9.6
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: secretlint
  dependency-version: 13.0.4
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: stylelint
  dependency-version: 17.14.1
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: typescript
  dependency-version: 7.0.2
  dependency-type: direct:development
  update-type: version-update:semver-major
  dependency-group: dependabot-all
- dependency-name: typescript-eslint
  dependency-version: 8.65.0
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
  ...

- [`a1d3fce`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/a1d3fce0ab4d0f64e1d4244bbee507757f71b85c "Diff: 5 files, +125 | -132") — 👷 [ci] Use shared workflow callers&nbsp;<sub><em>(5&nbsp;files,&nbsp;+125,&nbsp;-132)</em></sub>
  - 👷 [ci] Switches the Dependabot auto-merge caller to workflow-templates@main and replaces local security and maintenance workflows with shared reusable callers.
  - ⬆️ [build] Updates eslint-config-nick2bad4u to the published caller override version and records any peer dependency needed for the shared ESLint config to load.

### 🛠️ Other Changes

- [`6d7405e`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/6d7405ef3a418d1d61f6d4e20ad603ea3dc98f5e "Diff: 2 files, +109 | -109") — Merge PR #6&nbsp;<sub><em>(2&nbsp;files,&nbsp;+109,&nbsp;-109)</em></sub>
  - [dependency] Update esbuild 0.28.1 in the npm_and_yarn group across 1 directory

> [!NOTE]
> **Release comparison**: https://github.com/Nick2bad4u/gh-runs-cleanup/compare/v1.0.1...v2.0.0

## ✨ What's Changed in v1.0.1

- <b>Commit Range: ➡️</b> [`v1.0.0...v1.0.1`](https://github.com/Nick2bad4u/gh-runs-cleanup/compare/v1.0.0...v1.0.1 "View full commit range on GitHub")

### ✨ Features

- [`4a30abf`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/4a30abf8f58a06c2c3098219ed6d092e1cb25ecc "Diff: 6 files, +10 | -1") — _(cli)_ Add new CLI entry points for TypeScript modules&nbsp;<sub><em>(6&nbsp;files,&nbsp;+10,&nbsp;-1)</em></sub>

- [`ff9d72e`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/ff9d72ec1dacc4816396219bfd3d8351f542e18e "Diff: 1 file, +294 | -98") — _(cli)_ Enhance help command with structured output and additional options&nbsp;<sub><em>(1&nbsp;file,&nbsp;+294,&nbsp;-98)</em></sub>

- [`51d35a3`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/51d35a3f767c4898e6b802b0e6e8a6dd6aee3beb "Diff: 2 files, +157 | -31") — ✨ [feat] Improves workflow run fetching with progress tracking&nbsp;<sub><em>(2&nbsp;files,&nbsp;+157,&nbsp;-31)</em></sub>
  - ✨ [feat] Adds enhanced progress tracking and pagination support for workflow run fetching
  - 🚀 **Core Changes:**
- Refactors listRuns function to support two different fetching strategies
- Adds new listRunsViaGhRunList function for workflow-specific runs
- Implements pagination-based fetching using GitHub API for better performance
  - 📊 **Progress Tracking:**
- Introduces ListRunsProgressCallback type for real-time progress updates
- Adds detailed progress reporting during fetch operations
- Updates progress bar to show current status, page info, and run counts
  - 🔧 **Technical Improvements:**
- Adds workflow-specific handling when workflow flag is provided
- Implements limit-based pagination with configurable page size
- Enhances error handling and response parsing
- Maps API response fields to WorkflowRun interface consistently
  - 📝 **Documentation:**
- Updates help text to note compatibility mode behavior with --workflow flag
- Explains reduced progress update frequency in workflow mode
  - ⚡ **Performance:**
- Reduces memory usage by processing runs in pages
- Improves fetch efficiency for large result sets
- Maintains backward compatibility with existing CLI usage

- [`ff6dd1e`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/ff6dd1ea66894b1d469c5bbecd4f0cd8b9dbdc31 "Diff: 1 file, +28 | -17") — _(cli)_ Add multi-repo targeting and robust CI/progress output controls&nbsp;<sub><em>(1&nbsp;file,&nbsp;+28,&nbsp;-17)</em></sub>
  - ✨ [feat] (targeting) support bulk repository cleanup
- Add `--repos <owner/repo[,owner/repo...]>` (repeatable) for multi-repo runs
- Add `--all-repos` to target all repos in an account
- Add `--owner <login>` for `--all-repos` (defaults to authenticated user)
- Resolve account/login with `gh api user --jq .login`
- Discover repos with `gh repo list <owner> --limit 1000 --json nameWithOwner`
- Validate and dedupe all target repos in strict `owner/name` format
  - 🚸 [style] (output) improve long-run UX and interactive safety
- Add `--no-progress` to disable progress bars explicitly
- Add `--ci` to disable interactive formatting (color, unicode, progress)
- Keep single-repo JSON shape unchanged
- Add aggregate JSON output for multi-repo mode (`aggregate` + per-repo `repos`)
  - 🐛 [fix] (progress) make progress bars render in-place reliably
- Clear terminal line before each redraw (`\r` + clear line escape)
- Reorder planning/status output to avoid clobbering progress line
- Remove duplicate per-attempt updates
- Shorten progress suffix tokens (id/a/d/f) to reduce wrapping
- Add terminal-width-aware suffix truncation to prevent line wraps on narrow consoles
  - 📝 [docs] (help) expand CLI help for new targeting/output flags
- Document `--repos`, `--all-repos`, `--owner`
- Document `--no-progress` and `--ci`
- Add examples for multi-repo and all-repos workflows
  - 🧪 [test] (cli) add validation coverage for new flag constraints
- Add test for invalid `--all-repos` + `--repo` combination
- Keep full lint/build/test suite passing

- [`b269740`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/b2697409703b315c132f51f1d4708c047265a90b "Diff: 2 files, +381 | -178") — _(cli)_ Add multi-repository cleanup targeting with account-wide mode&nbsp;<sub><em>(2&nbsp;files,&nbsp;+381,&nbsp;-178)</em></sub>
  - ✨ [feat] (targeting) support bulk repo selection in one command
- Add `--repos <owner/repo[,owner/repo...]>` for multi-repo cleanup
- Make `--repos` repeatable and merge values into a deduplicated target set
- Add `--all-repos` to target all repositories for an account/login
- Add `--owner <login>` for `--all-repos` (defaults to authenticated user)
  - ✨ [feat] (discovery) add account/repository resolution helpers
- Resolve authenticated login via `gh api user --jq .login`
- Discover repositories via `gh repo list <owner> --limit 1000 --json nameWithOwner`
- Validate every resolved target repo in strict `owner/name` format
  - 🐛 [fix] (validation) enforce safe flag combinations
- Reject `--all-repos` when combined with `--repo` or `--repos`
- Improve target-resolution errors when no usable repository context exists
  - ✨ [feat] (output) extend runtime/output flow for multi-repo execution
- Process each target repository sequentially with per-repo summaries
- Keep text mode readable with repo section headers in multi-repo runs
- Preserve single-repo JSON shape for compatibility
- Add multi-repo JSON payload with `aggregate` totals + per-repo `repos` summaries
  - 📝 [docs] (help) update CLI help for new targeting options
- Document `--repos`, `--all-repos`, and `--owner`
- Add usage examples for multi-repo and all-repos modes
  - 🧪 [test] (cli) add coverage for new flag conflict validation
- Add test asserting `--all-repos` cannot be combined with `--repo`
- Keep full lint/build/test suite passing

- [`a09a18f`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/a09a18f9a3b3fa6367d27ba9994eab03d3bb439a "Diff: 1 file, +105 | -4") — _(cli)_ Add --no-progress and CI-safe non-interactive output mode&nbsp;<sub><em>(1&nbsp;file,&nbsp;+105,&nbsp;-4)</em></sub>
  - ✨ [feat] (flags) add explicit progress and CI controls
- Add `--no-progress` to disable progress bars in interactive terminals
- Add `--ci` to force CI-friendly output behavior
  - 🚸 [style] (output) make CI mode disable interactive formatting
- In `--ci`, force color mode to `never`
- In `--ci`, force unicode mode to `never`
- In `--ci`, disable progress bar rendering
- Keep structured/log-friendly text output intact
  - 📝 [docs] (help) update CLI help entries
- Document `--no-progress` under output controls
- Document `--ci` behavior for automation environments
  - 🧪 [test] (validation) verify no regressions
- Run format/lint/build/test after flag wiring
- Keep all existing CLI validation tests passing

- [`ab06cc5`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/ab06cc51d111e51ec00e8a3559b740bf60fb5768 "Diff: 1 file, +70 | -20") — _(cli)_ Add rich terminal rendering with color/unicode modes and polished help output&nbsp;<sub><em>(1&nbsp;file,&nbsp;+70,&nbsp;-20)</em></sub>
  - ✨ [feat] (cli) Expand output rendering controls for terminal UX
- Add `--color <auto|always|never>` with `--no-color` alias
- Add `--unicode <auto|always|never>` with `--no-unicode` alias
- Auto-detect TTY capability and gracefully fall back for non-interactive terminals
  - 🎨 [style] (cli) Improve readability with semantic ANSI formatting
- Colorize status cells in tables (success/failure/cancelled/in-progress/unknown)
- Highlight key counts and deletion outcomes (deleted/failed/planned) with contextual colors
- Bold critical identifiers in verbose output for faster scanning
  - 🚜 [refactor] (cli) Make table rendering ANSI-safe and unicode-capable
- Update table width logic to account for VT control sequences (`stripVTControlCharacters`)
- Add Unicode border rendering with ASCII fallback to preserve compatibility
  - 📝 [docs] (cli) clean up help text spacing and add colored help rendering
- Fix option alignment/indentation in `--help` output
- Colorize help sections/options/examples while respecting color mode flags
- Document new unicode/color flags and aliases in help text
  - 🧪 [test] (cli) extend validation coverage for new output modes
- Add invalid `--color` mode test
- Add invalid `--unicode` mode test
- Keep full lint/build/test pipeline passing

### 🛠️ Bug Fixes

- [`0309965`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/0309965153b1ee0965c17a8c5152500f1cd56315 "Diff: 5 files, +753 | -103") — _(release)_ Build binary gh extension assets&nbsp;<sub><em>(5&nbsp;files,&nbsp;+753,&nbsp;-103)</em></sub>
  - 🐛 [fix] Add a Node SEA asset builder so releases attach Linux and Windows binary extension artifacts instead of relying on script-clone installs.
  - 👷 [build] Wire the release workflow to build linux-amd64 and windows-amd64 assets and upload them with the GitHub release.
  - ➕ [build] Add esbuild as the bundler used by the asset build script.

- [`b426b43`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/b426b43e80aaf215845f8f6b6faaa33850aab06d "Diff: 1 file, +1 | -1") — 🛠️ [fix] Preserves status array input&nbsp;<sub><em>(1&nbsp;file,&nbsp;+1,&nbsp;-1)</em></sub>
  - Uses the parsed multi-value status list directly instead of recasting it, keeping status filtering consistent and avoiding unnecessary type assumptions.

- [`af0eb46`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/af0eb4671a5628396182fc8ad099afcb481f2be1 "Diff: 1 file, +25 | -2") — _(cli)_ Improve long-run progress clarity for fetch vs delete phases&nbsp;<sub><em>(1&nbsp;file,&nbsp;+25,&nbsp;-2)</em></sub>
  - 🐛 [fix] (progress) prevent delete phase from appearing frozen during retries
- Add per-attempt progress updates while deleting each workflow run
- Surface current run id and retry attempt (e.g. attempt=2/3) in progress suffix
- Keep deleted/failed counters visible throughout long-running operations
  - 🚸 [style] (output) clarify planned deletion counts before destructive phase
- Print planning summary before delete loop:
  planned deletions, fetched runs, and unique run count
- Reduce confusion when fetched totals and final delete totals differ due to dedupe/filters/caps
  - 🧪 [test] keep validation green after progress/reporting changes
- Re-run format, lint, build, and test suite successfully

- [`aeb9b28`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/aeb9b28d298664a728d9701e100aa854009f1166 "Diff: 1 file, +3 | -3") — _(cli)_ Change Default limit to 500&nbsp;<sub><em>(1&nbsp;file,&nbsp;+3,&nbsp;-3)</em></sub>

- [`dc55822`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/dc558220d6678347d4ac14af8968dbf8e14f2cf3 "Diff: 1 file, +42 | -22") — _(cli)_ Correct unicode table border alignment and enhance summary color rendering&nbsp;<sub><em>(1&nbsp;file,&nbsp;+42,&nbsp;-22)</em></sub>
  - 🐛 [fix] (output) Resolve unicode table border width mismatch
- Update table border segment sizing to include cell padding width
- Ensure top/middle/bottom separators line up with rendered row content
  - ✨ [feat] (output) Add richer semantic coloring across summary tables
- Colorize table headers and key metric labels for faster scanning
- Highlight status values, matched/planned counts, and skip counts contextually
- Improve dry-run workflow table readability with colorized planned deletion counts
- Keep ANSI-safe width handling intact so colored cells remain aligned
  - 🧪 [test] (cli) keep full validation suite green after output changes
- Run lint/build/tests successfully with all existing argument validation checks passing

### 🚜 Refactor

- [`18fff6d`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/18fff6d9bc6f80907e611b74dc24fbe69e171d4f "Diff: 3 files, +71 | -61") — 🚜 [refactor] Simplifies CLI formatting logic&nbsp;<sub><em>(3&nbsp;files,&nbsp;+71,&nbsp;-61)</em></sub>
  - 🧹 Extracts shared helpers to reduce duplicated styling and truncation logic.
- 🎨 Streamlines help text and progress output assembly for cleaner rendering.
- ⚙️ Reworks color, unicode, and status option parsing into clearer branches.

- [`79b2103`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/79b210399859a28cecbc843ad9139cb6b152e316 "Diff: 6 files, +1641 | -1435") — 🚜 [refactor] Modularizes CLI orchestration&nbsp;<sub><em>(6&nbsp;files,&nbsp;+1641,&nbsp;-1435)</em></sub>
  - 🚜 Extracts GH command execution, help text, styling, and output rendering into dedicated helpers.
- 🚜 Simplifies the entrypoint so it focuses on argument parsing, repository processing, and summary emission.
- 🚜 Preserves progress reporting, retry-based deletions, and text/JSON output behavior while improving structure.

### 🎨 Styling

- [`e8cd04a`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/e8cd04a900d662e2dfe5194a1c2a0ba3fcd6dec3 "Diff: 5 files, +631 | -633") — 🎨 [style] Normalize markdown formatting&nbsp;<sub><em>(5&nbsp;files,&nbsp;+631,&nbsp;-633)</em></sub>
  - 🎨 [style] Apply the repository Prettier rules to Markdown guidance and documentation files so release verification passes cleanly.

### 🧹 Chores

- [`9426435`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/942643547879b2616e80983536a168825fc98c7c "Diff: 2 files, +3 | -3") — Release v1.0.1&nbsp;<sub><em>(2&nbsp;files,&nbsp;+3,&nbsp;-3)</em></sub>

- [`5ddf6d1`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/5ddf6d1afc8aa1bc3f4e07cc37bf753e2916c80a "Diff: 6 files, +123 | -171") — Update github agent instruction paths&nbsp;<sub><em>(6&nbsp;files,&nbsp;+123,&nbsp;-171)</em></sub>

- [`9d67cd8`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/9d67cd809bd374831582e2be902d20b82917aceb "Diff: 1 file, +0 | -1") — Stop ignoring mdx in prettierignore&nbsp;<sub><em>(1&nbsp;file,&nbsp;+0,&nbsp;-1)</em></sub>

- [`fc3a95b`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/fc3a95bef2dfae2d4c830eec42d854a7d40bc0d2 "Diff: 1 file, +0 | -7") — Stop ignoring markdown files in prettierignore&nbsp;<sub><em>(1&nbsp;file,&nbsp;+0,&nbsp;-7)</em></sub>

- [`17e8ab0`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/17e8ab0fcdef99fb8fab49a764b58da32c7cbc79 "Diff: 8 files, +1426 | -2") — Sync AGENTS and tooling updates&nbsp;<sub><em>(8&nbsp;files,&nbsp;+1426,&nbsp;-2)</em></sub>

### 👷 CI/CD

- [`5a453c7`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/5a453c713a786b3a3698624f756dbd9ba8eda910 "Diff: 1 file, +45 | -0") — 👷 [ci] Adds SonarCloud analysis config&nbsp;<sub><em>(1&nbsp;file,&nbsp;+45,&nbsp;-0)</em></sub>
  - 👷 Configures SonarCloud to focus on source and test roots with the root TypeScript config.
  - 🧹 Excludes generated output, dependencies, docs, and config stubs to reduce analysis noise.
  - 📝 Leaves coverage reporting ready for a future lcov report.

### 🛡️ Security

- [`6306296`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/6306296ea0d55d66f279c4b555b908dfc2f18522 "Diff: 7 files, +192 | -146") — _(deps)_ [dependency] Update dependency group&nbsp;<sub><em>(7&nbsp;files,&nbsp;+192,&nbsp;-146)</em></sub>
  - Bumps the dependabot-all group with 27 updates:
  - | Package                                                                                                                             | From      | To        |
    | ----------------------------------------------------------------------------------------------------------------------------------- | --------- | --------- |
    | [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/node)                                              | `25.6.0`  | `25.9.1`  |
    | [eslint](https://github.com/eslint/eslint)                                                                                          | `10.2.1`  | `10.4.1`  |
    | [globals](https://github.com/sindresorhus/globals)                                                                                  | `17.5.0`  | `17.6.0`  |
    | [prettier-plugin-jsdoc](https://github.com/hosseinmd/prettier-plugin-jsdoc)                                                         | `1.8.0`   | `1.8.1`   |
    | [prettier-plugin-multiline-arrays](https://github.com/electrovir/prettier-plugin-multiline-arrays)                                  | `4.1.7`   | `4.1.8`   |
    | [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/typescript-eslint)                    | `8.59.1`  | `8.60.0`  |
    | [@augment-vir/assert](https://github.com/electrovir/augment-vir)                                                                    | `31.68.4` | `31.71.3` |
    | [@augment-vir/common](https://github.com/electrovir/augment-vir)                                                                    | `31.68.4` | `31.71.3` |
    | [@augment-vir/core](https://github.com/electrovir/augment-vir)                                                                      | `31.68.4` | `31.71.3` |
    | [@eslint/config-helpers](https://github.com/eslint/rewrite/tree/HEAD/packages/config-helpers)                                       | `0.5.5`   | `0.6.0`   |
    | [@eslint/plugin-kit](https://github.com/eslint/rewrite/tree/HEAD/packages/plugin-kit)                                               | `0.7.1`   | `0.7.2`   |
    | [@types/estree](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/estree)                                          | `1.0.8`   | `1.0.9`   |
    | [@typescript-eslint/eslint-plugin](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/eslint-plugin)         | `8.59.1`  | `8.60.0`  |
    | [@typescript-eslint/parser](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/parser)                       | `8.59.1`  | `8.60.0`  |
    | [@typescript-eslint/project-service](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/project-service)     | `8.59.1`  | `8.60.0`  |
    | [@typescript-eslint/scope-manager](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/scope-manager)         | `8.59.1`  | `8.60.0`  |
    | [@typescript-eslint/tsconfig-utils](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/tsconfig-utils)       | `8.59.1`  | `8.60.0`  |
    | [@typescript-eslint/type-utils](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/type-utils)               | `8.59.1`  | `8.60.0`  |
    | [@typescript-eslint/types](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/types)                         | `8.59.1`  | `8.60.0`  |
    | [@typescript-eslint/typescript-estree](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/typescript-estree) | `8.59.1`  | `8.60.0`  |
    | [@typescript-eslint/utils](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/utils)                         | `8.59.1`  | `8.60.0`  |
    | [@typescript-eslint/visitor-keys](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/visitor-keys)           | `8.59.1`  | `8.60.0`  |
    | [brace-expansion](https://github.com/juliangruber/brace-expansion)                                                                  | `5.0.5`   | `5.0.6`   |
    | [comment-parser](https://github.com/yavorskiy/comment-parser)                                                                       | `1.4.6`   | `1.4.7`   |
    | [semver](https://github.com/npm/node-semver)                                                                                        | `7.7.4`   | `7.8.1`   |
    | [sql-formatter](https://github.com/sql-formatter-org/sql-formatter)                                                                 | `15.7.3`  | `15.8.0`  |
    | [undici-types](https://github.com/nodejs/undici)                                                                                    | `7.19.2`  | `7.24.6`  |
  - Updates `@types/node` from 25.6.0 to 25.9.1
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/node)
  - Updates `eslint` from 10.2.1 to 10.4.1
- [Release notes](https://github.com/eslint/eslint/releases)
- [Commits](https://github.com/eslint/eslint/compare/v10.2.1...v10.4.1)
  - Updates `globals` from 17.5.0 to 17.6.0
- [Release notes](https://github.com/sindresorhus/globals/releases)
- [Commits](https://github.com/sindresorhus/globals/compare/v17.5.0...v17.6.0)
  - Updates `prettier-plugin-jsdoc` from 1.8.0 to 1.8.1
- [Release notes](https://github.com/hosseinmd/prettier-plugin-jsdoc/releases)
- [Changelog](https://github.com/fardad-dev/prettier-plugin-jsdoc/blob/master/CHANGELOG.md)
- [Commits](https://github.com/hosseinmd/prettier-plugin-jsdoc/commits)
  - Updates `prettier-plugin-multiline-arrays` from 4.1.7 to 4.1.8
- [Release notes](https://github.com/electrovir/prettier-plugin-multiline-arrays/releases)
- [Commits](https://github.com/electrovir/prettier-plugin-multiline-arrays/compare/v4.1.7...v4.1.8)
  - Updates `typescript-eslint` from 8.59.1 to 8.60.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/typescript-eslint/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.60.0/packages/typescript-eslint)
  - Updates `@augment-vir/assert` from 31.68.4 to 31.71.3
- [Release notes](https://github.com/electrovir/augment-vir/releases)
- [Commits](https://github.com/electrovir/augment-vir/compare/v31.68.4...v31.71.3)
  - Updates `@augment-vir/common` from 31.68.4 to 31.71.3
- [Release notes](https://github.com/electrovir/augment-vir/releases)
- [Commits](https://github.com/electrovir/augment-vir/compare/v31.68.4...v31.71.3)
  - Updates `@augment-vir/core` from 31.68.4 to 31.71.3
- [Release notes](https://github.com/electrovir/augment-vir/releases)
- [Commits](https://github.com/electrovir/augment-vir/compare/v31.68.4...v31.71.3)
  - Updates `@eslint/config-helpers` from 0.5.5 to 0.6.0
- [Release notes](https://github.com/eslint/rewrite/releases)
- [Changelog](https://github.com/eslint/rewrite/blob/main/packages/config-helpers/CHANGELOG.md)
- [Commits](https://github.com/eslint/rewrite/commits/core-v0.6.0/packages/config-helpers)
  - Updates `@eslint/plugin-kit` from 0.7.1 to 0.7.2
- [Release notes](https://github.com/eslint/rewrite/releases)
- [Changelog](https://github.com/eslint/rewrite/blob/main/packages/plugin-kit/CHANGELOG.md)
- [Commits](https://github.com/eslint/rewrite/commits/plugin-kit-v0.7.2/packages/plugin-kit)
  - Updates `@types/estree` from 1.0.8 to 1.0.9
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/estree)
  - Updates `@typescript-eslint/eslint-plugin` from 8.59.1 to 8.60.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.60.0/packages/eslint-plugin)
  - Updates `@typescript-eslint/parser` from 8.59.1 to 8.60.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/parser/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.60.0/packages/parser)
  - Updates `@typescript-eslint/project-service` from 8.59.1 to 8.60.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/project-service/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.60.0/packages/project-service)
  - Updates `@typescript-eslint/scope-manager` from 8.59.1 to 8.60.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/scope-manager/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.60.0/packages/scope-manager)
  - Updates `@typescript-eslint/tsconfig-utils` from 8.59.1 to 8.60.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/tsconfig-utils/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.60.0/packages/tsconfig-utils)
  - Updates `@typescript-eslint/type-utils` from 8.59.1 to 8.60.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/type-utils/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.60.0/packages/type-utils)
  - Updates `@typescript-eslint/types` from 8.59.1 to 8.60.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/types/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.60.0/packages/types)
  - Updates `@typescript-eslint/typescript-estree` from 8.59.1 to 8.60.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/typescript-estree/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.60.0/packages/typescript-estree)
  - Updates `@typescript-eslint/utils` from 8.59.1 to 8.60.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/utils/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.60.0/packages/utils)
  - Updates `@typescript-eslint/visitor-keys` from 8.59.1 to 8.60.0
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/visitor-keys/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.60.0/packages/visitor-keys)
  - Updates `brace-expansion` from 5.0.5 to 5.0.6
- [Release notes](https://github.com/juliangruber/brace-expansion/releases)
- [Commits](https://github.com/juliangruber/brace-expansion/compare/v5.0.5...v5.0.6)
  - Updates `comment-parser` from 1.4.6 to 1.4.7
- [Changelog](https://github.com/syavorsky/comment-parser/blob/main/CHANGELOG.md)
- [Commits](https://github.com/yavorskiy/comment-parser/commits/v1.4.7)
  - Updates `semver` from 7.7.4 to 7.8.1
- [Release notes](https://github.com/npm/node-semver/releases)
- [Changelog](https://github.com/npm/node-semver/blob/main/CHANGELOG.md)
- [Commits](https://github.com/npm/node-semver/compare/v7.7.4...v7.8.1)
  - Updates `sql-formatter` from 15.7.3 to 15.8.0
- [Release notes](https://github.com/sql-formatter-org/sql-formatter/releases)
- [Commits](https://github.com/sql-formatter-org/sql-formatter/compare/v15.7.3...v15.8.0)
  - Updates `undici-types` from 7.19.2 to 7.24.6
- [Release notes](https://github.com/nodejs/undici/releases)
- [Commits](https://github.com/nodejs/undici/compare/v7.19.2...v7.24.6)
  &#91;dependabot&#93;&#91;all&#93;(deps): [dependency] Update dependency group
  - Bumps the dependabot-all group with 4 updates: [step-security/harden-runner](https://github.com/step-security/harden-runner), [github/codeql-action](https://github.com/github/codeql-action), [actions/dependency-review-action](https://github.com/actions/dependency-review-action) and [gitleaks/gitleaks-action](https://github.com/gitleaks/gitleaks-action).
  - Updates `step-security/harden-runner` from 2.19.0 to 2.19.4
- [Release notes](https://github.com/step-security/harden-runner/releases)
- [Commits](https://github.com/step-security/harden-runner/compare/8d3c67de8e2fe68ef647c8db1e6a09f647780f40...9af89fc71515a100421586dfdb3dc9c984fbf411)
  - Updates `github/codeql-action` from 4.35.2 to 4.36.0
- [Release notes](https://github.com/github/codeql-action/releases)
- [Changelog](https://github.com/github/codeql-action/blob/main/CHANGELOG.md)
- [Commits](https://github.com/github/codeql-action/compare/95e58e9a2cdfd71adc6e0353d5c52f41a045d225...7211b7c8077ea37d8641b6271f6a365a22a5fbfa)
  - Updates `actions/dependency-review-action` from 4.9.0 to 5.0.0
- [Release notes](https://github.com/actions/dependency-review-action/releases)
- [Commits](https://github.com/actions/dependency-review-action/compare/2031cfc080254a8a887f58cffee85186f0e49e48...a1d282b36b6f3519aa1f3fc636f609c47dddb294)
  - Updates `gitleaks/gitleaks-action` from 2.3.9 to 3.0.0
- [Release notes](https://github.com/gitleaks/gitleaks-action/releases)
- [Commits](https://github.com/gitleaks/gitleaks-action/compare/ff98106e4c7b2bc287b24eaf42907196329070c7...e0c47f4f8be36e29cdc102c57e68cb5cbf0e8d1e)
  ***

updated-dependencies:

- dependency-name: "@types/node"
  dependency-version: 25.9.1
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: eslint
  dependency-version: 10.4.1
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: globals
  dependency-version: 17.6.0
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: prettier-plugin-jsdoc
  dependency-version: 1.8.1
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: prettier-plugin-multiline-arrays
  dependency-version: 4.1.8
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: typescript-eslint
  dependency-version: 8.60.0
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@augment-vir/assert"
  dependency-version: 31.71.3
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@augment-vir/common"
  dependency-version: 31.71.3
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@augment-vir/core"
  dependency-version: 31.71.3
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@eslint/config-helpers"
  dependency-version: 0.6.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@eslint/plugin-kit"
  dependency-version: 0.7.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: "@types/estree"
  dependency-version: 1.0.9
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/eslint-plugin"
  dependency-version: 8.60.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/parser"
  dependency-version: 8.60.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/project-service"
  dependency-version: 8.60.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/scope-manager"
  dependency-version: 8.60.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/tsconfig-utils"
  dependency-version: 8.60.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/type-utils"
  dependency-version: 8.60.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/types"
  dependency-version: 8.60.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/typescript-estree"
  dependency-version: 8.60.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/utils"
  dependency-version: 8.60.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/visitor-keys"
  dependency-version: 8.60.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: brace-expansion
  dependency-version: 5.0.6
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: comment-parser
  dependency-version: 1.4.7
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: semver
  dependency-version: 7.8.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: sql-formatter
  dependency-version: 15.8.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: undici-types
  dependency-version: 7.24.6
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: step-security/harden-runner
  dependency-version: 2.19.4
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: github/codeql-action
  dependency-version: 4.36.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: actions/dependency-review-action
  dependency-version: 5.0.0
  dependency-type: direct:production
  update-type: version-update:semver-major
  dependency-group: dependabot-all
- dependency-name: gitleaks/gitleaks-action
  dependency-version: 3.0.0
  dependency-type: direct:production
  update-type: version-update:semver-major
  dependency-group: dependabot-all
  ...

- [`42eadc9`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/42eadc9524c4fd8868797ab4353ad593a3f60e83 "Diff: 8 files, +129 | -115") — _(deps)_ [dependency] Update dependency group&nbsp;<sub><em>(8&nbsp;files,&nbsp;+129,&nbsp;-115)</em></sub>
  - Bumps the dependabot-all group with 9 updates:
  - | Package                                                                                 | From     | To       |
    | --------------------------------------------------------------------------------------- | -------- | -------- |
    | [step-security/harden-runner](https://github.com/step-security/harden-runner)           | `2.14.2` | `2.19.0` |
    | [actions/setup-node](https://github.com/actions/setup-node)                             | `6.3.0`  | `6.4.0`  |
    | [github/codeql-action](https://github.com/github/codeql-action)                         | `4.32.4` | `4.35.2` |
    | [actions/dependency-review-action](https://github.com/actions/dependency-review-action) | `4.8.3`  | `4.9.0`  |
    | [actions/configure-pages](https://github.com/actions/configure-pages)                   | `5`      | `6`      |
    | [actions/upload-pages-artifact](https://github.com/actions/upload-pages-artifact)       | `3`      | `5`      |
    | [actions/deploy-pages](https://github.com/actions/deploy-pages)                         | `4`      | `5`      |
    | [actions/upload-artifact](https://github.com/actions/upload-artifact)                   | `4`      | `7`      |
    | [softprops/action-gh-release](https://github.com/softprops/action-gh-release)           | `2.6.2`  | `3.0.0`  |
  - Updates `step-security/harden-runner` from 2.14.2 to 2.19.0
- [Release notes](https://github.com/step-security/harden-runner/releases)
- [Commits](https://github.com/step-security/harden-runner/compare/v2.14.2...8d3c67de8e2fe68ef647c8db1e6a09f647780f40)
  - Updates `actions/setup-node` from 6.3.0 to 6.4.0
- [Release notes](https://github.com/actions/setup-node/releases)
- [Commits](https://github.com/actions/setup-node/compare/53b83947a5a98c8d113130e565377fae1a50d02f...48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e)
  - Updates `github/codeql-action` from 4.32.4 to 4.35.2
- [Release notes](https://github.com/github/codeql-action/releases)
- [Changelog](https://github.com/github/codeql-action/blob/main/CHANGELOG.md)
- [Commits](https://github.com/github/codeql-action/compare/89a39a4e59826350b863aa6b6252a07ad50cf83e...95e58e9a2cdfd71adc6e0353d5c52f41a045d225)
  - Updates `actions/dependency-review-action` from 4.8.3 to 4.9.0
- [Release notes](https://github.com/actions/dependency-review-action/releases)
- [Commits](https://github.com/actions/dependency-review-action/compare/05fe4576374b728f0c523d6a13d64c25081e0803...2031cfc080254a8a887f58cffee85186f0e49e48)
  - Updates `actions/configure-pages` from 5 to 6
- [Release notes](https://github.com/actions/configure-pages/releases)
- [Commits](https://github.com/actions/configure-pages/compare/v5...v6)
  - Updates `actions/upload-pages-artifact` from 3 to 5
- [Release notes](https://github.com/actions/upload-pages-artifact/releases)
- [Commits](https://github.com/actions/upload-pages-artifact/compare/v3...v5)
  - Updates `actions/deploy-pages` from 4 to 5
- [Release notes](https://github.com/actions/deploy-pages/releases)
- [Commits](https://github.com/actions/deploy-pages/compare/v4...v5)
  - Updates `actions/upload-artifact` from 4 to 7
- [Release notes](https://github.com/actions/upload-artifact/releases)
- [Commits](https://github.com/actions/upload-artifact/compare/v4...v7)
  - Updates `softprops/action-gh-release` from 2.6.2 to 3.0.0
- [Release notes](https://github.com/softprops/action-gh-release/releases)
- [Changelog](https://github.com/softprops/action-gh-release/blob/master/CHANGELOG.md)
- [Commits](https://github.com/softprops/action-gh-release/compare/3bb12739c298aeb8a4eeaf626c5b8d85266b0e65...b4309332981a82ec1c5618f44dd2e27cc8bfbfda)
  &#91;dependabot&#93;&#91;all&#93;(deps): [dependency] Update dependency group
  - Bumps the dependabot-all group with 19 updates:
  - | Package                                                                                                                             | From     | To       |
    | ----------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- |
    | [eslint](https://github.com/eslint/eslint)                                                                                          | `10.2.0` | `10.2.1` |
    | [prettier-plugin-multiline-arrays](https://github.com/electrovir/prettier-plugin-multiline-arrays)                                  | `4.1.5`  | `4.1.7`  |
    | [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/typescript-eslint)                    | `8.58.2` | `8.59.1` |
    | [typescript](https://github.com/microsoft/TypeScript)                                                                               | `6.0.2`  | `6.0.3`  |
    | [@date-vir/duration](https://github.com/electrovir/date-vir)                                                                        | `8.3.1`  | `8.3.2`  |
    | [@humanfs/core](https://github.com/humanwhocodes/humanfs)                                                                           | `0.19.1` | `0.19.2` |
    | [@humanfs/node](https://github.com/humanwhocodes/humanfs/tree/HEAD/packages/node)                                                   | `0.16.7` | `0.16.8` |
    | [@typescript-eslint/eslint-plugin](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/eslint-plugin)         | `8.58.2` | `8.59.1` |
    | [@typescript-eslint/parser](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/parser)                       | `8.58.2` | `8.59.1` |
    | [@typescript-eslint/project-service](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/project-service)     | `8.58.2` | `8.59.1` |
    | [@typescript-eslint/scope-manager](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/scope-manager)         | `8.58.2` | `8.59.1` |
    | [@typescript-eslint/tsconfig-utils](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/tsconfig-utils)       | `8.58.2` | `8.59.1` |
    | [@typescript-eslint/type-utils](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/type-utils)               | `8.58.2` | `8.59.1` |
    | [@typescript-eslint/types](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/types)                         | `8.58.2` | `8.59.1` |
    | [@typescript-eslint/typescript-estree](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/typescript-estree) | `8.58.2` | `8.59.1` |
    | [@typescript-eslint/utils](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/utils)                         | `8.58.2` | `8.59.1` |
    | [@typescript-eslint/visitor-keys](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/visitor-keys)           | `8.58.2` | `8.59.1` |
    | [ajv](https://github.com/ajv-validator/ajv)                                                                                         | `6.14.0` | `6.15.0` |
    | [type-fest](https://github.com/sindresorhus/type-fest)                                                                              | `5.5.0`  | `5.6.0`  |
  - Updates `eslint` from 10.2.0 to 10.2.1
- [Release notes](https://github.com/eslint/eslint/releases)
- [Commits](https://github.com/eslint/eslint/compare/v10.2.0...v10.2.1)
  - Updates `prettier-plugin-multiline-arrays` from 4.1.5 to 4.1.7
- [Release notes](https://github.com/electrovir/prettier-plugin-multiline-arrays/releases)
- [Commits](https://github.com/electrovir/prettier-plugin-multiline-arrays/compare/v4.1.5...v4.1.7)
  - Updates `typescript-eslint` from 8.58.2 to 8.59.1
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/typescript-eslint/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.59.1/packages/typescript-eslint)
  - Updates `typescript` from 6.0.2 to 6.0.3
- [Release notes](https://github.com/microsoft/TypeScript/releases)
- [Commits](https://github.com/microsoft/TypeScript/compare/v6.0.2...v6.0.3)
  - Updates `@date-vir/duration` from 8.3.1 to 8.3.2
- [Release notes](https://github.com/electrovir/date-vir/releases)
- [Commits](https://github.com/electrovir/date-vir/compare/v8.3.1...v8.3.2)
  - Updates `@humanfs/core` from 0.19.1 to 0.19.2
- [Release notes](https://github.com/humanwhocodes/humanfs/releases)
- [Commits](https://github.com/humanwhocodes/humanfs/compare/core-v0.19.1...core-v0.19.2)
  - Updates `@humanfs/node` from 0.16.7 to 0.16.8
- [Release notes](https://github.com/humanwhocodes/humanfs/releases)
- [Changelog](https://github.com/humanwhocodes/humanfs/blob/main/packages/node/CHANGELOG.md)
- [Commits](https://github.com/humanwhocodes/humanfs/commits/node-v0.16.8/packages/node)
  - Updates `@typescript-eslint/eslint-plugin` from 8.58.2 to 8.59.1
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.59.1/packages/eslint-plugin)
  - Updates `@typescript-eslint/parser` from 8.58.2 to 8.59.1
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/parser/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.59.1/packages/parser)
  - Updates `@typescript-eslint/project-service` from 8.58.2 to 8.59.1
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/project-service/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.59.1/packages/project-service)
  - Updates `@typescript-eslint/scope-manager` from 8.58.2 to 8.59.1
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/scope-manager/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.59.1/packages/scope-manager)
  - Updates `@typescript-eslint/tsconfig-utils` from 8.58.2 to 8.59.1
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/tsconfig-utils/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.59.1/packages/tsconfig-utils)
  - Updates `@typescript-eslint/type-utils` from 8.58.2 to 8.59.1
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/type-utils/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.59.1/packages/type-utils)
  - Updates `@typescript-eslint/types` from 8.58.2 to 8.59.1
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/types/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.59.1/packages/types)
  - Updates `@typescript-eslint/typescript-estree` from 8.58.2 to 8.59.1
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/typescript-estree/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.59.1/packages/typescript-estree)
  - Updates `@typescript-eslint/utils` from 8.58.2 to 8.59.1
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/utils/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.59.1/packages/utils)
  - Updates `@typescript-eslint/visitor-keys` from 8.58.2 to 8.59.1
- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)
- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/visitor-keys/CHANGELOG.md)
- [Commits](https://github.com/typescript-eslint/typescript-eslint/commits/v8.59.1/packages/visitor-keys)
  - Updates `ajv` from 6.14.0 to 6.15.0
- [Release notes](https://github.com/ajv-validator/ajv/releases)
- [Commits](https://github.com/ajv-validator/ajv/compare/v6.14.0...v6.15.0)
  - Updates `type-fest` from 5.5.0 to 5.6.0
- [Release notes](https://github.com/sindresorhus/type-fest/releases)
- [Commits](https://github.com/sindresorhus/type-fest/compare/v5.5.0...v5.6.0)
  ***

updated-dependencies:

- dependency-name: step-security/harden-runner
  dependency-version: 2.19.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: actions/setup-node
  dependency-version: 6.4.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: github/codeql-action
  dependency-version: 4.35.2
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: actions/dependency-review-action
  dependency-version: 4.9.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: actions/configure-pages
  dependency-version: '6'
  dependency-type: direct:production
  update-type: version-update:semver-major
  dependency-group: dependabot-all
- dependency-name: actions/upload-pages-artifact
  dependency-version: '5'
  dependency-type: direct:production
  update-type: version-update:semver-major
  dependency-group: dependabot-all
- dependency-name: actions/deploy-pages
  dependency-version: '5'
  dependency-type: direct:production
  update-type: version-update:semver-major
  dependency-group: dependabot-all
- dependency-name: actions/upload-artifact
  dependency-version: '7'
  dependency-type: direct:production
  update-type: version-update:semver-major
  dependency-group: dependabot-all
- dependency-name: softprops/action-gh-release
  dependency-version: 3.0.0
  dependency-type: direct:production
  update-type: version-update:semver-major
  dependency-group: dependabot-all
- dependency-name: eslint
  dependency-version: 10.2.1
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: prettier-plugin-multiline-arrays
  dependency-version: 4.1.7
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: typescript-eslint
  dependency-version: 8.59.1
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: typescript
  dependency-version: 6.0.3
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: "@date-vir/duration"
  dependency-version: 8.3.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: "@humanfs/core"
  dependency-version: 0.19.2
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: "@humanfs/node"
  dependency-version: 0.16.8
  dependency-type: indirect
  update-type: version-update:semver-patch
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/eslint-plugin"
  dependency-version: 8.59.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/parser"
  dependency-version: 8.59.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/project-service"
  dependency-version: 8.59.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/scope-manager"
  dependency-version: 8.59.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/tsconfig-utils"
  dependency-version: 8.59.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/type-utils"
  dependency-version: 8.59.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/types"
  dependency-version: 8.59.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/typescript-estree"
  dependency-version: 8.59.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/utils"
  dependency-version: 8.59.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: "@typescript-eslint/visitor-keys"
  dependency-version: 8.59.1
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: ajv
  dependency-version: 6.15.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
- dependency-name: type-fest
  dependency-version: 5.6.0
  dependency-type: indirect
  update-type: version-update:semver-minor
  dependency-group: dependabot-all
  ...

### New Contributors

- @dependabot[bot] made their first contribution in [#5](https://github.com/Nick2bad4u/gh-runs-cleanup/pull/5)

> [!NOTE]
> **Release comparison**: https://github.com/Nick2bad4u/gh-runs-cleanup/compare/v1.0.0...v1.0.1

## ✨ What's Changed in v1.0.0

- <b>Commit Range: ➡️</b> [`c59a4bb...v1.0.0`](https://github.com/Nick2bad4u/gh-runs-cleanup/compare/c59a4bb121ae06cf768ab64d41476a68bb38e6ae...v1.0.0 "View full commit range on GitHub")

### ✨ Features

- [`8669e17`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/8669e17f6c624cad75ef8ee4b6a5f45665f1df39 "Diff: 2 files, +508 | -39") — _(cli)_ Add ANSI-semantic table coloring with unicode/ASCII output modes&nbsp;<sub><em>(2&nbsp;files,&nbsp;+508,&nbsp;-39)</em></sub>
  - ✨ [feat] (cli) Introduce richer terminal rendering for text output
- Add semantic ANSI styling for key values in summary/detail/verbose tables
- Colorize status cells (success/failure/cancelled/in-progress/unknown) for faster scanning
- Emphasize critical counts (planned/deleted/failed) with contextual color and weight
  - ✨ [feat] (cli) Add unicode rendering controls with safe auto fallback
- Add `--unicode <auto|always|never>` for table border/symbol mode selection
- Add `--no-unicode` alias as convenience shorthand for `--unicode never`
- Auto-detect terminal capabilities and gracefully fall back to ASCII when needed
  - 🚸 [style] (cli) improve output readability without breaking alignment
- Upgrade table renderer to support ANSI-colored cell content while preserving column width
- Keep machine mode untouched (`--json` remains clean, uncolored JSON output)
  - 📝 [docs] (cli) update help text for new output controls
- Document `--no-color`, `--unicode`, and `--no-unicode` in CLI help output
  - 🧪 [test] (cli) extend argument validation coverage
- Add test for invalid unicode mode handling
- Keep existing color validation coverage and full suite passing

- [`008dba0`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/008dba0b3da5f7e915c0bddb4fab0612adfb4d95 "Diff: 14 files, +2223 | -28") — ✨ [feat] Build gh-runs-cleanup as a typed GitHub CLI extension with release-ready docs and site&nbsp;<sub><em>(14&nbsp;files,&nbsp;+2223,&nbsp;-28)</em></sub>
  - ✨ [feat] (cli) Rebuild the extension as a TypeScript-based GitHub CLI tool
- Move core behavior into src/cli.ts with strict typing and testable main()/runCli() entrypoints
- Keep safe destructive behavior opt-in via --confirm / --yes and validate inputs before any live deletion
- Add richer cleanup controls including --all-statuses, --before-days, --order, --max-retries, --retry-delay-ms, --fail-fast, --max-failures, --exclude-workflow, and --exclude-branch
- Improve automation support with structured --json output, deterministic summaries, retry handling, and clearer error categorization
- Keep repo auto-detection via gh while validating explicit --repo owner/name input
  - 🔥 [refactor] (runtime) Convert legacy wrappers into thin extension entrypoints
- Update gh-runs-cleanup and cleanup-workflow-runs.mjs to delegate to the TypeScript CLI source
- Align the repo for GitHub CLI extension installation without relying on committed dist artifacts at install time
  - 👷 [build] (tooling) Add strict TypeScript and typed linting infrastructure
- Add tsconfig.json for modern NodeNext TypeScript builds
- Enable typescript-eslint strict + strictTypeChecked rules in eslint.config.mjs
- Add build, typecheck, release:check, formatting, and dependency maintenance scripts
- Install the required Prettier plugin stack and supporting development dependencies
  - 🧪 [test] (cli) Add Node-based CLI validation coverage
- Replace the old test file with test/cli.test.ts
- Cover invalid repo/status/limit/order/before-days/max-retries/retry-delay-ms/max-failures cases plus help and missing confirm behavior
- Keep npm test building dist output before running the test suite
  - 👷 [build] (release) Rework CI and release automation for this extension
- Update CI to run formatting, linting, typechecking, build, and tests for the TypeScript toolchain
- Replace the release flow with a manual workflow_dispatch-capable GitHub release pipeline
- Add release verification, version bump/tag handling, and generated release notes support for GitHub releases
  - 📝 [docs] (repo) Refresh project docs for the new extension architecture
- Rewrite the README around GitHub CLI extension installation, usage, filtering, JSON mode, and operational safety
- Add repository issue templates, pull request templates, and Copilot repo/folder instructions
- Update support and contribution surfaces to match the new gh-runs-cleanup purpose
  - ✨ [feat] (site) Add a GitHub Pages landing page for the extension
- Add a branded static site with hero copy, feature overview, install guidance, usage examples, filter reference, JSON example output, and CTA sections
- Include Nerd Font icons, a custom logo, Open Graph/Twitter social metadata, and a generated social preview asset
- Add copy-to-clipboard actions for install/demo/example commands and polish the layout for easier scanning without horizontal scrolling
- Improve visual hierarchy with stronger foreground/background separation, brighter code-window headers, better button/nav/card hover states, and a fixed primary GitHub button icon treatment
  - 🍱 [style] (assets) Add extension branding assets for the public site
- Add docs/site/logo.svg and docs/site/social-card.svg for favicon, branding, and link previews
  - 🙈 [chore] (repo) Clean up leftover template baggage and repo metadata
- Remove stale plugin-template assumptions and align the repository around a standalone gh extension
- Refresh ignore rules, dependency update config, and other repo-level housekeeping for the new stack

- [`3ef6377`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/3ef637704d635feffa6ecfef01b33ad9063e3b74 "Diff: 29 files, +4739 | -902") — ✨ [feat] Migrate repo to TypeScript GH extension with strict toolchain&nbsp;<sub><em>(29&nbsp;files,&nbsp;+4739,&nbsp;-902)</em></sub>
  - ✨ [feat] (cli) Add full TypeScript CLI source in src/cli.ts (798 lines)
- Comprehensive flag set: --status, --all-statuses, --before-days, --order,
  --exclude-workflow, --exclude-branch, --max-failures, --max-retries,
  --retry-delay-ms, --fail-fast, --quiet, --json, --yes/--confirm
- Auto-resolve repo via `gh repo view` when --repo is omitted; validates owner/name format
- RunSummary type tracks attempted/deleted/failed/skipped/skippedByExclusion/durationMs for --json output
- deleteRunWithRetry with configurable exponential backoff and isRetryableDeleteError detection
- Safety gate: --confirm/--yes required for live deletion; all validation runs before any network call
- sortRuns() supports oldest/newest/none ordering; stable sort by createdAt
- Exported main(argv) + runCli() for testability; import.meta.url direct-execution guard
  - 🔥 [refactor] (cli) Replace cleanup-workflow-runs.mjs with slim backwards-compat wrapper
- Original 400-line plain MJS implementation replaced with delegate to dist/src/cli.js
- gh-runs-cleanup entrypoint updated to import runCli() from compiled output
  - 👷 [build] Add TypeScript build pipeline with tsconfig.json
- NodeNext module resolution, ES2024 target, outDir ./dist, rootDir .
- All strict flags: noUncheckedIndexedAccess, exactOptionalPropertyTypes,
  verbatimModuleSyntax, noPropertyAccessFromIndexSignature
- build / typecheck / start / dev scripts added to package.json
  - 🧪 [test] Add Node test runner suite in test/cli.test.ts (10 tests)
- Covers validation for --repo format, --status, --limit, --order, --before-days,
  --max-retries, --retry-delay-ms, --max-failures, missing --confirm, --help exit 0
- withSilentConsole() helper suppresses output during assertion runs
- Remove legacy test/cleanup-workflow-runs.test.mjs (plain MJS runner)
- test script: npm run build && node --test dist/test/**/*.test.js
  - 🚨 [build] (eslint) Configure typescript-eslint strict + strictTypeChecked presets
- tseslint.configs.strict and strictTypeChecked applied to all .ts files
- parserOptions.projectService: true enables type-aware linting
- disableTypeChecked() applied to .js/.mjs/.cjs files
- no-floating-promises disabled in test files; restrict-template-expressions allows numbers/booleans
  - 🎨 [style] Add Prettier config and formatting pipeline
- Add .prettierrc with full plugin stack (jsdoc, multiline-arrays, sort-json, packagejson, etc.)
- Add .prettierignore; add format / format:check scripts to package.json
  - 📝 [docs] (readme) Rewrite README for gh-runs-cleanup extension
- Document all CLI flags including new --exclude-workflow, --exclude-branch, --max-failures
- Refresh Usage, Execution flags, and examples sections to match current flag set
  - 📝 [docs] Add GitHub issue/PR templates and Copilot instructions
- Add ISSUE_TEMPLATE: bug_report.yml, feature_request.yml, config.yml
- Add PULL_REQUEST_TEMPLATE: feature.md, bugfix.md, pull_request_template.md
- Add copilot-instructions.md (repo-wide) and folder-level instructions for
  src/, test/, docs/, and .github/workflows/
  - 👷 [ci] Update CI and release workflows for TS pipeline
- ci.yml: lint + typecheck + test wired to npm scripts
- release.yml: build + test steps gate before gh release create
  - 🔧 [chore] Add .ncurc.json for npm-check-updates configuration
    🙈 [chore] Expand .gitignore to comprehensive Node/TS/editor/tool coverage
    ⬆️ [chore] Update package.json; add typescript, typescript-eslint, prettier plugin stack

### 🎨 Styling

- [`5f178d1`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/5f178d110e3958eb657336a536187172ed9d8c4a "Diff: 114 files, +764 | -79213") — ⚰️ [style] Remove unused files&nbsp;<sub><em>(114&nbsp;files,&nbsp;+764,&nbsp;-79213)</em></sub>

- [`fbc6236`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/fbc6236ca50397fd55e91e0b2300a2b18da9e665 "Diff: 767 files, +367 | -132546") — ⚰️ [style] Remove unused files&nbsp;<sub><em>(767&nbsp;files,&nbsp;+367,&nbsp;-132546)</em></sub>

### 🧹 Chores

- [`4bd8965`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/4bd8965587f10c9cd7170fdc9f87a2d02072b06e "Diff: 2 files, +3 | -3") — Release v1.0.0&nbsp;<sub><em>(2&nbsp;files,&nbsp;+3,&nbsp;-3)</em></sub>

### 🛡️ Security

- [`e66a3ae`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/e66a3ae85285c013090dbb9949b48731be98f302 "Diff: 4 files, +21 | -5") — [StepSecurity] ci: Harden GitHub Actions&nbsp;<sub><em>(4&nbsp;files,&nbsp;+21,&nbsp;-5)</em></sub>

### 🛠️ Other Changes

- [`c59a4bb`](https://github.com/Nick2bad4u/gh-runs-cleanup/commit/c59a4bb121ae06cf768ab64d41476a68bb38e6ae "Diff: 896 files, +213517 | -0") — Initial commit&nbsp;<sub><em>(896&nbsp;files,&nbsp;+213517,&nbsp;-0)</em></sub>

### New Contributors

- @Nick2bad4u made their first contribution
- @github-actions[bot] made their first contribution
- @step-security-bot made their first contribution

## ⭐ Contributors

Thanks to anyone who has 🧑‍💻 [contributed](https://github.com/Nick2bad4u/gh-runs-cleanup/graphs/contributors).

_This changelog was automatically generated with ⛰️ [git-cliff](https://github.com/orhun/git-cliff)._
