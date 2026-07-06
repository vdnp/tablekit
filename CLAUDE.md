# TableKit — Universal Headless DataTable

> **Living document.** Update this file after every significant architectural decision.
> Last updated: 2026-07-07

## Purpose

TableKit is an npm-distributed, production-grade DataTable built as a **headless core +
platform adapters**. One state engine powers React (web/Next.js) and React Native UIs.
It is distributed publicly (MIT) and consumed by internal projects, so type safety,
resilience, and documentation are first-class requirements — not afterthoughts.

## Architecture

```
packages/
  core/          @tablekit/core          Platform-agnostic engine. Zero runtime deps,
                                         zero React. State (sorting, filtering, pagination,
                                         selection, expanding, grouping), column schema,
                                         data-source abstraction (array OR async fetcher),
                                         subscribe/getState store.
  react/         @tablekit/react         DOM renderer. useDataTable() hook (headless entry)
                                         + <DataTable /> component. SSR-safe, 'use client'
                                         marked, a11y (aria-sort, keyboard nav).
  react-native/  @tablekit/react-native  FlatList-based renderer (FlashList injectable via
                                         `ListComponent` prop). Same core, same hook shape.
  theme/         @tablekit/theme         Design tokens (spacing/color/typography/radius),
                                         light+dark themes, CSS-variable names for web,
                                         plain token objects for native.
examples/
  nextjs-app/    Next.js App Router example — also serves as the SSR integration test.
  expo-app/      Source-only Expo example (not installed in CI; RN toolchain too heavy).
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

- **Package scope:** `@tablekit/*`. Verify availability on npm before first publish; rename is a find/replace + changeset major if taken.
- **License:** MIT.
- **Minimum versions:** React ≥ 18.0, React Native ≥ 0.72, Next.js ≥ 14, TypeScript ≥ 5.0, Node ≥ 18.
- **Peer deps only** for react/react-native — never bundle them.
- **RN component tests:** RN's untranspiled Flow source doesn't run under Vitest. The RN package is verified by `tsc` type-check + Vitest tests of its pure helpers; full component tests require a Jest + `react-native` preset harness (tracked as TODO, do it before 1.0).

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
pnpm test               # turbo: vitest run in core + react
pnpm typecheck          # turbo: tsc --noEmit everywhere (incl. react-native)
pnpm lint               # eslint (flat config)
pnpm changeset          # record a change for release notes/versioning
pnpm -F @tablekit/core test -- --watch    # single package, watch mode
pnpm -F nextjs-app build                  # end-to-end SSR integration check
```

## Adding a feature — decision rules

1. **Does it change what the table *knows* (state, derived rows)?** → `core` first. Add the state slice + updater + pipeline step + unit tests, then expose it through both adapters.
2. **Does it change only how the table *looks/behaves in UI*?** → adapter only. Never push platform code down into core.
3. **New visual defaults** (colors, spacing) → `theme` tokens, consumed via CSS variables (web) / token object (native). Never hardcode colors in adapters.
4. Every public API addition needs: strict types, dev warning for misuse where applicable, a test, a README section, and a changeset.
5. Update this file when the decision was architectural (new package, new state slice, new peer dep, changed API shape).

## Versioning / releases

- **Changesets** drive versions and CHANGELOG. Every user-facing change gets `pnpm changeset` (patch = fix, minor = feature, major = breaking API).
- All `@tablekit/*` packages version independently but are released together from `main`.
- Pre-1.0: minor may include breaking changes (documented in changeset). Post-1.0: strict semver.

## Do NOT

- ❌ Import React, ReactDOM, or React Native **anywhere in `core`** (types included — core stays renderer-agnostic).
- ❌ Leak RN-specific code (StyleSheet, FlatList types) into `core` or `react`; leak DOM types (HTMLElement, CSS strings) into `core` or `react-native`.
- ❌ Add runtime dependencies to `core` (it ships with zero).
- ❌ Use `any`, non-null `!` on external data, or swallow errors from `fetchData` — errors must reach state + `onError`.
- ❌ Mutate rows/columns passed in by users; treat all inputs as readonly.
- ❌ Use default exports or `export *` barrels.
- ❌ Access `window`/`document`/`navigator` outside guarded, client-only code paths.
- ❌ Publish without: green tests, green typecheck, Next.js example builds, changeset present.
