# TableKit

<!--
  npm badges — ready to enable AFTER the first successful publish (until then
  they 404 because the packages don't exist on the registry yet; see
  docs/guides/releasing.md → first-release checklist). Uncomment this block once
  @vdnp/tablekit-* is live on npm:

  [![@vdnp/tablekit-core](https://img.shields.io/npm/v/@vdnp/tablekit-core?label=%40vdnp%2Ftablekit-core)](https://www.npmjs.com/package/@vdnp/tablekit-core)
  [![@vdnp/tablekit-react](https://img.shields.io/npm/v/@vdnp/tablekit-react?label=%40vdnp%2Ftablekit-react)](https://www.npmjs.com/package/@vdnp/tablekit-react)
  [![@vdnp/tablekit-react-native](https://img.shields.io/npm/v/@vdnp/tablekit-react-native?label=%40vdnp%2Ftablekit-react-native)](https://www.npmjs.com/package/@vdnp/tablekit-react-native)
  [![@vdnp/tablekit-theme](https://img.shields.io/npm/v/@vdnp/tablekit-theme?label=%40vdnp%2Ftablekit-theme)](https://www.npmjs.com/package/@vdnp/tablekit-theme)
  [![downloads](https://img.shields.io/npm/dm/@vdnp/tablekit-react?label=downloads)](https://www.npmjs.com/package/@vdnp/tablekit-react)
  [![license](https://img.shields.io/npm/l/@vdnp/tablekit-react)](LICENSE)
-->

**One headless table engine. Web, Next.js, and React Native — same API, same types.**

TableKit is a production-grade DataTable split into a platform-agnostic **core**
(state, sorting, filtering, pagination, grouping, selection) and thin **adapters**
that render it on the DOM or in React Native. Pick the batteries-included
`<DataTable />` component, or take the `useDataTable()` hook and render your own UI.

```tsx check
import { DataTable, createColumnHelper } from "@vdnp/tablekit-react";
import "@vdnp/tablekit-react/styles.css";

interface User {
  id: number;
  name: string;
  age: number;
}

const helper = createColumnHelper<User>();
const columns = [
  helper.accessor("name", { header: "Name", sortable: true }),
  helper.accessor("age", { header: "Age", sortable: true, align: "right" }),
];

export function Users({ users }: { users: User[] }) {
  return (
    <DataTable<User>
      columns={columns}
      data={users}
      getRowId={(user) => String(user.id)}
      showGlobalFilter
    />
  );
}
```

## Why TableKit

- **Truly universal.** The engine has zero React and zero DOM code, so web and
  native share one battle-tested state machine — not two parallel implementations.
- **Headless *or* batteries-included.** Use `<DataTable />` for a styled,
  accessible table out of the box, or `useDataTable()` when you need full control
  of the markup. Both drive the identical core.
- **Client *and* server data, one API.** Pass a `data` array or an async
  `fetchData` function — sorting, filtering and pagination flow through the same
  props either way.
- **Strictly typed.** Fully generic over your row type `<TData>`; `accessorKey` is
  constrained to real keys of your data at compile time. No `any` in the public API.
- **Resilient by design.** Null/`undefined` cells, throwing accessors, malformed
  fetch responses and stale async races are handled with safe fallbacks instead of
  crashes. `fetchData` errors always reach state + `onError` — never swallowed.
- **SSR-safe.** `createTable()` performs no side effects; fetching starts in an
  effect. Works with the Next.js App Router with correct `"use client"` boundaries.

## Features

| Area | What you get |
| --- | --- |
| Sorting | Single & multi-column (shift-click), custom `sortFn`, null-safe default compare |
| Filtering | Per-column filters + a global search, custom `filterFn`, array/substring/equality defaults |
| Pagination | Client-side slicing or server-side page fetching, page-size control, clamping |
| Grouping | Group by one or more columns, expandable group rows with leaf counts |
| Selection | Per-row + select-all (filter-aware), group selection, bulk-action bar |
| Expanding | Detail rows via `renderExpandedRow`, expand/collapse state |
| Server mode | Async `fetchData`, race protection, `isLoading`/`error`/`refetch` |
| Accessibility | `aria-sort`, keyboard row navigation, roles/states, reduced-motion, live regions |
| Theming | Design tokens, CSS variables, built-in light/dark, per-instance overrides |
| React Native | `FlatList` by default, FlashList injectable via `ListComponent` |

## Packages

| Package | Description | npm |
| --- | --- | --- |
| [`@vdnp/tablekit-core`](packages/core) | Headless engine — no React, no DOM, zero deps | `npm i @vdnp/tablekit-core` |
| [`@vdnp/tablekit-react`](packages/react) | Web/Next.js adapter: `useDataTable()` + `<DataTable />` | `npm i @vdnp/tablekit-react` |
| [`@vdnp/tablekit-react-native`](packages/react-native) | React Native adapter (FlatList/FlashList) | `npm i @vdnp/tablekit-react-native` |
| [`@vdnp/tablekit-theme`](packages/theme) | Shared design tokens + light/dark themes | `npm i @vdnp/tablekit-theme` |

> Published under the personal npm scope **`@vdnp`** (the `@tablekit` org name
> isn't owned). Packages go live on the first release — see the
> [release guide](docs/guides/releasing.md).

## Install

Web / Next.js:

```bash
npm i @vdnp/tablekit-react @vdnp/tablekit-theme
# pnpm add @vdnp/tablekit-react @vdnp/tablekit-theme
# yarn add @vdnp/tablekit-react @vdnp/tablekit-theme
```

React Native (FlashList optional but recommended for large lists):

```bash
npm i @vdnp/tablekit-react-native @vdnp/tablekit-theme
npm i @shopify/flash-list
```

`react` / `react-dom` / `react-native` are **peer dependencies** — TableKit never
bundles them.

## Documentation

- **Package guides:** [core](packages/core/README.md) · [react](packages/react/README.md) · [react-native](packages/react-native/README.md) · [theme](packages/theme/README.md)
- **API reference (generated):** [docs/api-reference](docs/api-reference/README.md)
- **Guides:** [Next.js App Router](docs/guides/nextjs.md) · [Migrating from TanStack Table](docs/guides/migration-from-tanstack-table.md)
- **[Troubleshooting](docs/troubleshooting.md)** — SSR hydration, big-data performance, controlled-state pitfalls
- **[Contributing](CONTRIBUTING.md)** — monorepo setup, core/adapter rules, changeset flow
- **[CLAUDE.md](CLAUDE.md)** — architecture decisions and conventions

## Monorepo layout

```
packages/core          engine (no React)
packages/react         web adapter
packages/react-native  native adapter
packages/theme         design tokens
examples/nextjs-app    App Router demo + SSR integration test
examples/expo-app      RN demo (source-only, outside the workspace)
docs/                  guides, troubleshooting, generated API reference
```

```bash
pnpm install
pnpm build        # all packages (turbo)
pnpm test         # core + adapters
pnpm typecheck
pnpm docs:check   # typecheck doc snippets + validate links
pnpm -F nextjs-app build   # end-to-end SSR check
```

## Versioning

Releases are driven by [Changesets](https://github.com/changesets/changesets).
Every user-facing change ships a changeset (`pnpm changeset`). See
[CONTRIBUTING.md](CONTRIBUTING.md#changesets).

## License

[MIT](LICENSE) © TableKit contributors
