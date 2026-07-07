# Troubleshooting

Real pitfalls and how TableKit is built to avoid them. Each entry explains the
*why* so you can reason about your own case, not just copy a fix.

- [SSR / hydration mismatches](#ssr--hydration-mismatches)
- [Controlled state that won't update](#controlled-state-that-wont-update)
- [Unnecessary re-renders / infinite loops](#unnecessary-re-renders--infinite-loops)
- [Selection or expansion resets unexpectedly](#selection-or-expansion-resets-unexpectedly)
- [Large data sets & performance](#large-data-sets--performance)
- [React Native: FlatList vs FlashList](#react-native-flatlist-vs-flashlist)
- [Server mode: stale rows, flicker, errors](#server-mode-stale-rows-flicker-errors)
- [Styling & theming](#styling--theming)
- [TypeScript errors](#typescript-errors)

## SSR / hydration mismatches

**Symptom:** React logs "Hydration failed" / "Text content did not match" around
the table in Next.js.

**Why it usually isn't TableKit:** `createTable()` is side-effect free, and the
adapters subscribe with `useSyncExternalStore` using a **server snapshot**, so the
engine renders identically on server and client. Server-mode fetching is deferred
to a `useEffect`, so no data-dependent divergence happens during hydration.

**Common real causes:**

- Feeding non-deterministic values into rows/columns during render — `Date.now()`,
  `Math.random()`, `new Date().toLocaleString()` (locale/timezone differ),
  `localStorage`. Gate these behind an effect or format deterministically.
- Restoring table state from `localStorage`/URL **during render**. Read it in an
  effect and treat the first render as the default state.
- A non-deterministic `getRowId`.

See the [Next.js guide](guides/nextjs.md#avoiding-hydration-mismatches) for the
full set of rules.

## Controlled state that won't update

**Symptom:** You pass `state={{ sorting }}` but clicking a header does nothing.

**Why:** A controlled slice is owned by *you*. TableKit reads it from `state` and
routes changes to your `on<Slice>Change` callback — it never mutates a controlled
slice itself. If the callback doesn't write the value back into the state you pass
next render, the slice is frozen.

**Fix:** Control it fully (pass both, and persist), or leave it uncontrolled.

```tsx
// ✅ fully controlled
const [sorting, setSorting] = useState<SortingState>([]);
<DataTable state={{ sorting }} onSortingChange={setSorting} … />

// ✅ uncontrolled (TableKit owns it; callback is optional)
<DataTable initialState={{ sorting: [] }} onSortingChange={analytics} … />

// ❌ half-controlled: reads state.sorting but never writes it back → stuck
<DataTable state={{ sorting: [] }} … />
```

You can mix per slice: control `sorting`, let core own `pagination`, etc.

## Unnecessary re-renders / infinite loops

**Symptom:** The table re-renders constantly, or you hit "Maximum update depth
exceeded".

**Why:** TableKit memoizes its derived row model per state version and only
notifies subscribers on real changes. But if you recreate `columns`, `data`, or
callbacks on every render, you invalidate that work and can feed a change→render
loop (e.g. a new `data` array identity each render that also triggers a controlled
setter).

**Fix:**

- Define `columns` at module scope, or wrap in `useMemo` with a stable dep array.
- Keep `data` referentially stable (don't `.map()`/spread it inline each render).
- Wrap `fetchData` in `useCallback`.
- Keep `getRowId` stable.
- In controlled setups, don't call a state setter unconditionally during render.

## Selection or expansion resets unexpectedly

**Symptom:** Selected rows clear after sorting/filtering, or the wrong rows appear
selected after data changes.

**Why:** Without `getRowId`, rows are keyed by their array index. Re-order or
re-fetch the data and index N is now a different row, so selection/expansion
(which are keyed by row id) no longer line up.

**Fix:** Always pass a stable `getRowId` when using selection, expansion, or
server mode:

```tsx
<DataTable getRowId={(row) => String(row.id)} … />
```

## Large data sets & performance

**Client mode** filters/sorts/paginates the **entire** array on each relevant
state change. That's fine into the low tens of thousands of rows, but:

- Rendering only the current page keeps the DOM small — keep `pageSize` sane.
- For very large client data, prefer **server mode** (`fetchData`) so the heavy
  lifting happens in your backend/database and only a page is shipped.
- Web virtualization of a single long page is out of scope for the built-in
  `<DataTable />`; if you need it, go headless with `useDataTable()` and feed
  `flatRows` into a virtualizer (e.g. `@tanstack/react-virtual`). Core stays
  independent of any virtualization library by design.

Keep memoization intact (see [re-renders](#unnecessary-re-renders--infinite-loops)) —
recreating `columns`/`data` each render is the most common perf regression.

## React Native: FlatList vs FlashList

`<DataTable />` uses `FlatList` by default. For long lists, inject FlashList:

```tsx
import { FlashList } from "@shopify/flash-list";
import type { Row, VirtualListComponent } from "@tablekit/react-native";

<DataTable
  ListComponent={FlashList as unknown as VirtualListComponent<Row<T>>}
  …
/>
```

Guidance:

- **FlatList** is fine for short/medium lists and has zero extra deps.
- **FlashList** recycles views and is markedly faster for large lists, but needs
  reasonably consistent row heights to shine. If your `renderExpandedRow` produces
  wildly variable heights, expect more layout churn.
- The package depends on **neither** FlashList nor FlatList internals — it targets
  a small structural interface (`data`, `renderItem`, `keyExtractor`, `extraData`,
  `ListEmptyComponent`), which is why the `as unknown as …` cast is needed and
  safe.

## Server mode: stale rows, flicker, errors

- **Stale rows never render.** Each fetch has a request id; if a newer request
  starts before an older resolves, the older response is dropped. You don't
  configure this.
- **Rapid changes are coalesced.** A change that also resets the page index (most
  filter/sort changes) triggers a single fetch, not two.
- **Errors are never swallowed.** A throwing/rejecting `fetchData` sets
  `getError()` and calls `onError`; the built-in error state offers **Retry**
  (`table.refetch()`). A malformed result (not `{ rows, totalCount }`) degrades to
  an empty table with a dev warning rather than crashing.
- **Loading fl/flash:** the component shows the skeleton only when there are no
  rows yet; subsequent page changes keep the previous rows until the new page
  arrives, unless you customize `renderLoading`.

## Styling & theming

- **Nothing is styled (web):** you forgot `import "@tablekit/react/styles.css";`
  at your app root.
- **Overrides don't apply:** set `--tk-*` variables on an **ancestor** of the
  table root, or pass a `theme` token object. The stylesheet uses low-specificity
  selectors so your CSS variables win.
- **Dark mode:** use `colorScheme="dark"` (web built-in) or pass `theme={darkTheme}`.
  On React Native there's no CSS — always drive it via `theme`/`colorScheme`.

## TypeScript errors

- **`accessorKey` rejects my string:** it's constrained to `keyof TData & string`.
  Typos or non-existent fields fail to compile — that's intended. Use
  `helper.computed(id, fn)` for derived values that aren't real keys.
- **`value` is `unknown` in `cell`:** you likely wrote a raw `ColumnDef` with only
  `accessorFn`. Use `createColumnHelper().accessor("key", …)` (infers the value
  type from the key) or `.computed(id, fn, …)` (infers from the function).
- **Module has no exported member:** import value vs type correctly — types like
  `SortingState`, `FetchParams`, `ColumnDef` are `export type` and can be imported
  with `import type`.
- **React Native types:** ensure `@types/react` and your `react-native` version
  are installed; the adapter is typed against RN ≥ 0.72.

Still stuck? Open an issue with a minimal reproduction — see
[CONTRIBUTING.md → Reporting bugs](../CONTRIBUTING.md#reporting-bugs).
