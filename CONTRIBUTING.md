# Contributing to TableKit

Thanks for helping improve TableKit! This guide covers local setup, the one
architectural rule that matters most, and the checks to run before opening a PR.

For the full design rationale and conventions, see [CLAUDE.md](CLAUDE.md).

## Prerequisites

- **Node ≥ 18**
- **pnpm ≥ 9** (`npm i -g pnpm`)
- Git

## Setup

```bash
git clone <repo-url>
cd tablekit
pnpm install     # bootstraps the whole workspace
pnpm build       # build all packages once (adapters resolve core's dist)
```

Monorepo layout:

```
packages/core          engine (no React, no DOM, zero deps)
packages/react         web adapter
packages/react-native  native adapter
packages/theme         design tokens
examples/nextjs-app    App Router demo + SSR integration test
examples/expo-app      RN demo (source-only, outside the workspace)
docs/                  guides, troubleshooting, generated API reference
```

`examples/expo-app` is intentionally **outside** the pnpm workspace (the RN
toolchain is heavy). To run it, `cd examples/expo-app && pnpm install` after a
root `pnpm build`.

## Common commands

Run from the repo root ([Turborepo](https://turbo.build) orchestrates per-package tasks):

| Command | What it does |
| --- | --- |
| `pnpm build` | Build every package (tsup → ESM + CJS + `.d.ts`) |
| `pnpm test` | Run Vitest across `core` and `react` |
| `pnpm typecheck` | `tsc --noEmit` everywhere, including `react-native` |
| `pnpm lint` | ESLint (flat config) |
| `pnpm docs:check` | Typecheck tagged doc snippets + validate relative links |
| `pnpm changeset` | Record a change for release notes/versioning |
| `pnpm -F @vdnp/tablekit-core test -- --watch` | One package, watch mode |
| `pnpm -F nextjs-app build` | End-to-end SSR check |

## The core/adapter rule

**Before adding a feature, decide where it lives:**

1. **Does it change what the table *knows* — state, or the derived rows?**
   → It belongs in **`@vdnp/tablekit-core`**. Add the state slice + updater + pipeline
   step + unit tests there first, then surface it through *both* adapters.
2. **Does it change only how the table *looks or behaves in the UI*?**
   → It belongs in the **adapter** (`react` / `react-native`) only. Never push
   platform code into core.
3. **Is it a new visual default** (color, spacing, radius)?
   → It belongs in **`@vdnp/tablekit-theme`** as a token, consumed via CSS variables
   (web) or the token object (native). Don't hardcode colors in adapters.

Hard boundaries (enforced by review):

- ❌ No React / ReactDOM / React Native imports in `core` — **types included**.
- ❌ No DOM types in `react-native`, no RN types in `react`, neither in `core`.
- ❌ No runtime dependencies added to `core` (it ships with zero).
- ❌ No `any`, no non-null `!` on external data, no swallowing `fetchData` errors.
- ❌ No default exports and no `export *` barrels — re-export by name.
- ❌ No `window`/`document`/`navigator` outside guarded, client-only paths.

Every public API addition needs: strict types, a dev-time misuse warning where
applicable, a test, a README section, and a changeset.

## Changesets

Releases and the changelog are driven by
[Changesets](https://github.com/changesets/changesets). Any user-facing change
needs one.

```bash
pnpm changeset
```

Then:

1. Select the affected packages (space to toggle, enter to confirm).
2. Choose a bump per package:
   - **patch** — bug fix, no API change
   - **minor** — new feature, backward compatible
   - **major** — breaking API change (pre-1.0, breaking changes may ship in a
     minor but must be documented in the changeset)
3. Write a short, user-facing summary (this becomes the changelog entry).
4. Commit the generated file under `.changeset/` with your change.

You don't publish anything — pushing your changeset to `main` lets CI open a
**"Version Packages"** PR, and merging that PR publishes to npm automatically.
The full flow (and one-time maintainer setup) is in the
[release guide](docs/guides/releasing.md).

## Before you open a PR

Run the full gate locally — CI runs the same:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm docs:check
pnpm -F nextjs-app build   # if you touched the react adapter or SSR behavior
```

Checklist:

- [ ] Feature landed in the right layer (core vs adapter vs theme).
- [ ] Strict types, no `any`.
- [ ] Tests added/updated (core logic → unit tests; adapters → Testing Library).
- [ ] Docs updated (see [CLAUDE.md → Documentation](CLAUDE.md#documentation) for
      which files to touch).
- [ ] A changeset is included.
- [ ] `CLAUDE.md` updated if the change was architectural.

## Reporting bugs

Open an issue with a minimal reproduction (a CodeSandbox/StackBlitz or a small
snippet), the package + version, platform (web / RN / Next.js), and expected vs
actual behavior. For type errors, include the exact TypeScript message and your
`tsconfig` `strict`/`moduleResolution` settings.
