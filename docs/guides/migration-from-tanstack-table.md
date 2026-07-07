# Migrating from TanStack Table

If you've used TanStack Table (React Table v8), TableKit will feel familiar: both
are headless, generic over your row type, and column-driven. This guide maps the
concepts you already know onto TableKit. It's a **conceptual** mapping — no code
is copied from TanStack Table; write your own using the TableKit examples in the
package READMEs.

## Mental model differences

| Topic | TanStack Table | TableKit |
| --- | --- | --- |
| Row models | You opt into `getCoreRowModel`, `getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel`, … | Built in. One `getRowModel()`; the pipeline (filter → sort → group → paginate) always runs in client mode. |
| Server data | You set `manual*` flags and wire your own fetching around the table | First-class `fetchData` mode with `isLoading` / `error` / `refetch` and race protection. |
| Rendering | Headless only — you build all UI (or use community components) | Headless **and** a batteries-included `<DataTable />` per platform. |
| Platforms | Web-focused; RN is DIY | First-class React **and** React Native adapters over one core. |
| Value access | `row.getValue(columnId)` | `row.getValue(columnId)` (same idea; null-safe, never throws). |

The biggest shift: in TanStack you assemble behavior by importing row-model
factories; in TableKit the behavior is already in core, and you choose *client vs
server* by passing `data` or `fetchData`.

## API concept mapping

| TanStack Table | TableKit | Notes |
| --- | --- | --- |
| `useReactTable(options)` | `useDataTable(options)` (react / react-native) or `createTable(options)` (core) | Same "options in, table out" shape. |
| `createColumnHelper<T>()` | `createColumnHelper<T>()` | `columnHelper.accessor("key", …)` → `helper.accessor("key", …)`. |
| `columnHelper.accessor(fn, …)` | `helper.computed(id, fn, …)` | Computed columns take an explicit `id`. |
| `columnHelper.display(…)` | `helper.display({ id, … })` | Action/checkbox columns. |
| `getCoreRowModel()` | *(implicit)* | Always present. |
| `getSortedRowModel()` | *(implicit)* | Sorting is in the pipeline. |
| `getFilteredRowModel()` | *(implicit)* | Column filters **and** a global filter. |
| `getPaginationRowModel()` | *(implicit)* | Client pagination is built in. |
| `getGroupedRowModel()` / `getExpandedRowModel()` | *(implicit)* | `setGrouping([...])`, expand via `row.toggleExpanded()`. |
| `manualSorting` / `manualFiltering` / `manualPagination` | Pass `fetchData` instead of `data` | Server mode replaces all three at once. |
| `state` + `onStateChange` / `on<X>Change` | `state` + `on<Slice>Change` | Same controlled-state model, per slice. |
| `initialState` | `initialState` | Seeds uncontrolled slices. |
| `table.getRowModel().rows` | `table.getRowModel().flatRows` | `flatRows` is flattened in visual order (honors expansion); `rows` is the tree. |
| `row.getValue(id)` | `row.getValue(id)` | Null-safe in TableKit. |
| `row.getIsSelected()` / `toggleSelected()` | same | Same names. |
| `column.getToggleSortingHandler()` | `column.toggleSorting(desc?, additive?)` | Call it directly in your click handler. |
| `flexRender(cell.column.columnDef.cell, ctx)` | `column.def.cell({ row, column, table, value })` | The web adapter narrows the result to `ReactNode`; use `renderSlot` if rendering slots yourself. |
| `columnDef.meta` | `columnDef.meta` | Same escape hatch. |
| `columnDef.enableSorting` | `columnDef.sortable` | Opt-in per column. |
| `columnDef.size` / `minSize` / `maxSize` | `width` / `minWidth` / `maxWidth` | Numbers, in pixels. |

## Column definition: before → after

Conceptually, a TanStack accessor column like "an `accessorKey` with a header and
a custom cell renderer" becomes:

```ts
import { createColumnHelper } from "@vdnp/tablekit-core";

interface User {
  name: string;
  age: number;
}

const helper = createColumnHelper<User>();

const columns = [
  helper.accessor("name", { header: "Name", sortable: true }),
  helper.accessor("age", {
    header: "Age",
    sortable: true,
    align: "right",
    cell: ({ value }) => value.toString(), // `value` inferred as number
  }),
];
```

Key differences to watch for:

- **Sorting/filtering are opt-in per column** via `sortable` / `filterable`,
  rather than enabled globally with per-column disables.
- **`cell` receives `{ row, column, table, value }`** — `value` is the already
  accessed, type-inferred value, so you rarely call `row.getValue` inside a cell.
- **You don't import row-model factories.** Delete the `getCoreRowModel()` etc.
  wiring entirely.

## Migration checklist

1. Replace `useReactTable` with `useDataTable` (or `createTable` for headless
   core use), and delete all `get*RowModel()` imports/among options.
2. Rename column flags: `enableSorting → sortable`, `enableColumnFilter →
   filterable`, `size → width`, etc.
3. Convert accessor-function columns to `helper.computed(id, fn, …)`.
4. If you used `manual*` + your own fetching, switch to `fetchData` and drop the
   manual flags; move your fetch logic into it and return `{ rows, totalCount }`.
5. Point your render loop at `getRowModel().flatRows`.
6. Consider whether you still need custom UI at all — the built-in `<DataTable />`
   may replace a chunk of it. Migrate incrementally: keep `useDataTable` +
   your markup first, then adopt `<DataTable />` where it fits.

## What TableKit intentionally does not (yet) have

TanStack Table has a larger surface. TableKit deliberately ships a focused core;
notably it does **not** currently include column ordering/visibility state,
faceted-value helpers, or fuzzy-ranking filters as first-class features. Column
visibility/order can be handled by controlling your `columns` array; custom
`filterFn`/`sortFn` cover most ranking needs. If you rely on those TanStack
features heavily, evaluate before migrating.
