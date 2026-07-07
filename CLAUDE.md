# TableKit — Universal Headless DataTable

> **Living document.** Update this file after every significant architectural decision.
> Last updated: 2026-07-07 (react-native Jest harness added: real component tests, isolated CI job)

## Purpose

TableKit is an npm-distributed, production-grade DataTable built as a **headless core +
platform adapters**. One state engine powers React (web/Next.js) and React Native UIs.
It is distributed publicly (MIT) and consumed by internal projects, so type safety,
resilience, and documentation are first-class requirements — not afterthoughts.

## Architecture

```
packages/
  core/          @vdnp/tablekit-core          Platform-agnostic engine. Zero runtime deps,
                                         zero React. State (sorting, filtering, pagination,
                                         selection, expanding, grouping), column schema,
                                         data-source abstraction (array OR async fetcher),
                                         subscribe/getState store.
  react/         @vdnp/tablekit-react         DOM renderer. useDataTable() hook (headless entry)
                                         + <DataTable /> component. SSR-safe, 'use client'
                                         marked, a11y (aria-sort, keyboard nav).
  react-native/  @vdnp/tablekit-react-native  FlatList-based renderer (FlashList injectable via
                                         `ListComponent` prop). Same core, same hook shape.
  theme/         @vdnp/tablekit-theme         Design tokens (spacing/color/typography/radius),
                                         light+dark themes, CSS-variable names for web,
                                         plain token objects for native.
examples/
  nextjs-app/    Next.js App Router example — also serves as the SSR integration test.
  expo-app/      Source-only Expo example — intentionally OUTSIDE the pnpm workspace
                 (see pnpm-workspace.yaml) so root installs stay light.
```

**Dependency direction (strict):** `core ← react`, `core ← react-native`, `theme ← react|react-native`.
`core` and `theme` never import from adapters. Adapters never import from each other.

### Data flow (core)

`data[]` → column filters → global filter → sort → group → (expand) → paginate → page rows.
In **server mode** (`fetchData` provided) the pipeline is skipped: core orchestrates the
fetch (race-protected via request id), stores `{ rows, totalCount, isLoading, error }`,
and re-fetches when sorting/filters/search/pagination change.

### Controlled vs uncontrolled

Every state slice (sorting, columnFilters, globalFilter, pagination, rowSelection,
expanded, grouping) works both ways: pass `state.<slice>` + `on<Slice>Change` to control
it; omit both and core owns it internally. Partial control is allowed per-slice.

## Assumptions (made explicit, revisit before publish)

- **Package scope:** `@vdnp/tablekit-*` (personal npm scope). Chosen over `@tablekit/*` because the `@tablekit` org name isn't owned; the four packages live under one scope as `@vdnp/tablekit-{core,react,react-native,theme}` (product name kept as a prefix). The whole rename was a single `@tablekit/` → `@vdnp/tablekit-` find/replace.
- **License:** MIT.
- **Minimum versions:** React ≥ 18.0, React Native ≥ 0.72, Next.js ≥ 14, TypeScript ≥ 5.0, Node ≥ 18.
- **Peer deps only** for react/react-native — never bundle them.
- **Example app pins:** nextjs-app uses Next 14 + React 18 (Next 15 pulls React 19; revisit when adapters are tested against 19).

## Decisions log

- `useDataTable` is intentionally **duplicated** in react and react-native (≈25 lines) rather than shared — adapters must not depend on each other, and a fourth "react-common" package isn't worth it at this size.
- Core declares `process`/`console` locally in `utils/dev.ts` instead of adding DOM/Node type deps (lib stays ES2020). Microtask scheduling uses `Promise.resolve().then` for the same reason.
- The `"use client"` directive is injected via tsup `banner` for the whole react package. tsup's treeshake pass logs "Module level directives … ignored" warnings — benign; the banner still lands first in dist. Verified by the Next.js production build.
- Render slots (`header`/`cell`) are declared with **method syntax** in `ColumnDef` so column defs stay assignable across `TValue` without `any` (methods are bivariant under strict mode).
- `<DataTable table={instance} />` skips `mount()`/`setOptions()` — the owning `useDataTable` call already handles both; double-mounting would double-fetch.
- Group rows default to **expanded**; the `expanded` map stores `false` to collapse them (leaf detail rows default collapsed, storing `true`).
- **API reference: TypeDoc + `typedoc-plugin-markdown`** (not API Extractor) — Extractor's `.api.md` is a review/gating artifact, whereas TypeDoc-markdown emits browsable per-package Markdown that renders on GitHub and fits the "markdown-only, no docs site yet" constraint. Generated by `docs/scripts/generate-api.mjs` (programmatic API; entry points forced to POSIX separators because TypeDoc treats them as globs; `disableSources` until a public git remote exists).
- **Doc QC is home-grown, offline** (`docs/scripts/check-code-blocks.mjs`, `check-links.mjs`) instead of remark/markdown-link-check — no network, deterministic, and the code checker reuses the repo's own TypeScript. Only fenced blocks whose info string contains `check` are compiled (against package `src` via tsconfig `paths`, so no build needed); RN snippets stay unchecked because `react-native` isn't installed at the repo root (it's a dev dep of the RN package only). Re-checked after the Jest harness landed: still exempt — the Jest suite resolves `react-native` *inside* the package, a different mechanism from the root-based doc checker, so it doesn't unblock root snippet compilation.
- **RN Jest harness (bare `react-native` preset, not `jest-expo`):** the adapter is a pure library importing only `react-native` core, so coupling its tests to the Expo runtime would be wrong and heavy (`jest-expo` is right for the Expo *example*, not the library). `@testing-library/react-native` pinned to **v12** (v13 targets React 19 / RN ≥ 0.78; we're on React 18.3 / RN 0.76).
- **RN package runs Jest for *all* its tests** (`"test": "jest"`); the pre-existing Vitest helper tests keep running **untouched** via a `vitest` → `@jest/globals` shim (`jest.config.cjs` moduleNameMapper → `test/jest-vitest-shim.ts`). Chosen over `vitest run && jest` so the per-package split stays literally "this package = jest". `vitest` is kept as a dev dep purely so `tsc` resolves the helper test's `from "vitest"` types.
- **Jest resolves workspace deps (`@vdnp/tablekit-core`/`theme`) to `src`** via moduleNameMapper, so the RN tests need no prior build and don't depend on package `exports` wiring. `transformIgnorePatterns` is pnpm-aware (allow-lists react-native/@react-native*/@testing-library anywhere in the path) because pnpm nests real packages under `.pnpm/…/node_modules/…` and the stock RN pattern only matches a top-level `node_modules/react-native/`.
- **Turbo `test` is per-package and framework-agnostic** — it just runs each package's `test` script, so mixing Vitest and Jest across packages needed no turbo changes. Verified: root `pnpm test` runs Vitest (core, react) + Jest (react-native), exit 0. CI still splits them into separate jobs so one framework's failure can't mask the other's.

## Test strategy

Two runners, on purpose — **do not "unify" them.**

- **Vitest** for `@vdnp/tablekit-core` and `@vdnp/tablekit-react`: fast, esbuild-based, ideal for the pure engine and the jsdom web adapter.
- **Jest** for `@vdnp/tablekit-react-native` **only**: React Native ships untranspiled Flow source that Vitest's esbuild resolver cannot parse, so real RN component tests require the official `react-native` Jest preset + Babel. This is a **deliberate, isolated exception**, not tech debt — all Jest config lives in `packages/react-native` (`jest.config.cjs`, `babel.config.cjs`) and never leaks to the root or other packages.

Coverage: core has unit tests (state pipeline, server mode, resilience); react has Testing Library component tests; react-native has pure-helper tests **plus** Jest + `@testing-library/react-native` component tests (render, empty/error/retry, filtering, sorting, pagination, selection + bulk actions, `ListComponent` injection, a11y state). CI runs Vitest and Jest as **separate jobs** (`.github/workflows/ci.yml`) so neither masks the other.

If a future contributor is tempted to move react-native onto Vitest for consistency: don't, unless RN starts shipping pre-transpiled source. The split is the cheapest correct option.

## Code style

- **TypeScript strict** everywhere (`strict: true`, `noUncheckedIndexedAccess: true`). `any` is banned; use `unknown` + type guards. Public API is fully generic over `<TData>`.
- `accessorKey` is constrained to `keyof TData & string` at compile time.
- Core's `cell`/`header` render slots return `unknown`; adapters narrow to `ReactNode`. This keeps core React-free.
- Files: one feature per file (`features/sorting.ts`), kebab-case filenames, named exports only, **no `default` exports**, no wildcard `export *` barrels — index files re-export explicitly by name (tree-shaking + `sideEffects: false`).
- Dev-time misuse warnings go through `devWarn()` (`packages/core/src/utils/dev.ts`) — stripped in production builds via `process.env.NODE_ENV` check.
- Never access `window`/`document` at module scope. In React use `useSyncExternalStore` with a server snapshot.

## Commands

Run from repo root (pnpm ≥ 9):

```
pnpm install            # bootstrap workspace
pnpm build              # turbo: tsup build of all packages (esm + cjs + d.ts)
pnpm test               # turbo: vitest (core, react) + jest (react-native)
pnpm typecheck          # turbo: tsc --noEmit everywhere (incl. react-native)
pnpm lint               # eslint (flat config)
pnpm changeset          # record a change for release notes/versioning
pnpm docs:api           # regenerate docs/api-reference/** (TypeDoc markdown)
pnpm docs:check         # typecheck tagged doc snippets + validate relative links
pnpm -F @vdnp/tablekit-core test -- --watch    # single package, watch mode
pnpm -F nextjs-app build                  # end-to-end SSR integration check
```

## Adding a feature — decision rules

1. **Does it change what the table *knows* (state, derived rows)?** → `core` first. Add the state slice + updater + pipeline step + unit tests, then expose it through both adapters.
2. **Does it change only how the table *looks/behaves in UI*?** → adapter only. Never push platform code down into core.
3. **New visual defaults** (colors, spacing) → `theme` tokens, consumed via CSS variables (web) / token object (native). Never hardcode colors in adapters.
4. Every public API addition needs: strict types, dev warning for misuse where applicable, a test, a README section, and a changeset.
5. Update this file when the decision was architectural (new package, new state slice, new peer dep, changed API shape).

## Documentation

Where docs live and **what to update when you change something**. All snippets
tagged ` ```ts check ` / ` ```tsx check ` are compiled by `pnpm docs:check`; keep
them complete and correct (RN snippets stay untagged — see decisions log).

| File | Scope | Update when… |
| --- | --- | --- |
| `README.md` (root) | Project pitch, feature list, package table, quick start | Feature list or package set changes |
| `packages/core/README.md` | Engine concepts, pipeline, server mode, controlled state | Any core behavior / option / `Table` method changes |
| `packages/react/README.md` | `useDataTable` + `<DataTable />`, props, a11y, SSR | Any react prop, default UI, or a11y behavior changes |
| `packages/react-native/README.md` | RN adapter, FlashList injection, a11y mapping, limits | Any RN prop or platform behavior changes |
| `packages/theme/README.md` | Token reference tables, web/native usage | A token is added/renamed/retyped |
| `docs/guides/nextjs.md` | App Router client/server setup, hydration rules | SSR behavior or the Next.js example changes |
| `docs/guides/migration-from-tanstack-table.md` | Concept mapping | A mapped concept/name changes, or a gap is closed |
| `docs/troubleshooting.md` | Known pitfalls + the "why" | A new footgun or resilience behavior appears |
| `CONTRIBUTING.md` | Setup, core/adapter rule, changeset flow, PR gate | Commands, workflow, or contribution rules change |
| `docs/api-reference/**` | **Generated** — do not hand-edit | Runs from `pnpm docs:api`; edit `src` doc-comments instead |

**Concrete rule of thumb:**

- **New column flag** (e.g. another `ColumnDef` field) → update the type's
  doc-comment in `packages/core/src/types.ts`, mention it in
  `packages/core/README.md` (concepts) and the relevant adapter README (how it
  renders), then `pnpm docs:api`.
- **New `<DataTable />` prop** → `packages/<adapter>/README.md` props table + an
  example (tag it `check` if it compiles from the repo root), then `pnpm docs:api`.
- **New/changed `Table` method or option** → `packages/core/README.md` API table +
  a snippet, then `pnpm docs:api`.
- Any of the above → also add a **changeset**.

`docs/api-reference/**` is committed (so the reference is browsable on GitHub
without a build) but regenerated, never hand-edited. Re-run `pnpm docs:api` and
`pnpm docs:check` before publishing.

## Release strategy

**Changesets** drive versions + CHANGELOG; **`changesets/action`** automates it.
Flow: a changeset merged to `main` → `.github/workflows/release.yml` opens a
"Version Packages" PR; merging that PR publishes to npm. No manual `npm publish`.
Full runbook: [docs/guides/releasing.md](docs/guides/releasing.md).

Decisions (with rationale — revisit at 1.0):

- **Lockstep / `fixed` versioning** (`.changeset/config.json` → `fixed`), *not*
  independent. The four packages are tightly coupled (react/react-native depend on
  core + theme via `workspace:*` exact pins) and always released together from
  `main`. Lockstep means `@vdnp/tablekit-*` at the same version are guaranteed
  compatible, which **eliminates** the "one goes major, another doesn't" breakage
  risk entirely — the cheapest correct model for a young, always-co-released
  family. Cost: an unchanged package still gets a version bump when a sibling
  changes (minor changelog noise). Revisit if release cadences diverge post-1.0;
  the exit is switching `fixed` → independent + `updateInternalDependencies`.
- **Versions start at `0.0.0`.** The publishable packages sit at `0.0.0` so the
  existing `initial-release` (minor) changeset makes the **first** published
  version a clean `0.1.0` (idiomatic Changesets: 0.0.0 is the "never published"
  sentinel). `pnpm release:status` confirms 0.0.0 → 0.1.0 across all four.
- **Beta / pre-release** supported via `changeset pre enter beta` (writes
  `.changeset/pre.json`); `changesets/action` auto-detects it, no workflow change.
  The first public line will likely be `0.1.0-beta.0`.
- **npm provenance ON** (`NPM_CONFIG_PROVENANCE=true` + `id-token: write` in
  release.yml). Achievable on GitHub Actions → enabled for supply-chain
  attestation. Two manual prerequisites (flagged in the release checklist): the
  repo must be **public** and each package's `repository.url` must match the real
  GitHub repo (now set to `github.com/vdnp/tablekit`) — otherwise disable it.
- **CI/release setup pinning.** The **pnpm version is single-sourced from the root
  `package.json` "packageManager" field** — do NOT also pass `version:` to
  `pnpm/action-setup@v4` (it errors "Multiple versions of pnpm specified" and every
  job fails at setup; this bit the first pushes). Node 20 is still set inline via
  `actions/setup-node` in both `ci.yml` and the composite action
  `.github/actions/setup` (release.yml + future workflows use the composite action).
- Pre-1.0: a breaking change may ship as a `minor` (0.x semantics), documented in
  the changeset. Post-1.0: strict semver.

## Do NOT

- ❌ Import React, ReactDOM, or React Native **anywhere in `core`** (types included — core stays renderer-agnostic).
- ❌ Leak RN-specific code (StyleSheet, FlatList types) into `core` or `react`; leak DOM types (HTMLElement, CSS strings) into `core` or `react-native`.
- ❌ Add runtime dependencies to `core` (it ships with zero).
- ❌ Use `any`, non-null `!` on external data, or swallow errors from `fetchData` — errors must reach state + `onError`.
- ❌ Mutate rows/columns passed in by users; treat all inputs as readonly.
- ❌ Use default exports or `export *` barrels.
- ❌ Access `window`/`document`/`navigator` outside guarded, client-only code paths.
- ❌ Publish without: green tests, green typecheck, green `docs:check`, regenerated `docs:api`, Next.js example builds, changeset present.
- ❌ Hand-edit anything under `docs/api-reference/**` — it's generated; edit `src` doc-comments and run `pnpm docs:api`.
