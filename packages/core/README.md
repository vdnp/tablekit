# @vdnp/tablekit-core

The platform-agnostic engine behind TableKit. **No React, no DOM, zero runtime
dependencies** — just table state and the derived row model. The
[`@vdnp/tablekit-react`](../react) and [`@vdnp/tablekit-react-native`](../react-native)
adapters render whatever this core computes; you can also drive it from your own
adapter, a test, or a script.

- [Quick start](#quick-start)
- [Core concepts](#core-concepts)
- [Advanced usage](#advanced-usage)
- [API reference](#api-reference)
- [Pitfalls & FAQ](#pitfalls--faq)

## Quick start

```bash
npm i @vdnp/tablekit-core
```

```ts check
import { createColumnHelper, createTable } from "@vdnp/tablekit-core";

interface User {
  id: number;
  name: string;
  age: number;
}

const users: User[] = [
  { id: 1, name: "Ada", age: 36 },
  { id: 2, name: "Grace", age: 85 },
];

const helper = createColumnHelper<User>();

const table = createTable<User>({
  columns: [
    helper.accessor("name", { sortable: true }),
    helper.accessor("age", { sortable: true }),
  ],
  data: users,
  getRowId: (user) => String(user.id),
});

// React to any state/data change:
const unsubscribe = table.subscribe(() => {
  for (const row of table.getRowModel().flatRows) {
    console.log(row.original.name);
  }
});

table.setSorting([{ id: "age", desc: true }]);
table.setGlobalFilter("a");
table.nextPage();

unsubscribe();
```

`createTable()` is **pure** — no timers, no fetches, no globals — so it is safe to
call during server rendering. Nothing happens until you read from it or call
`mount()`.

## Core concepts

### The data pipeline

In client mode, every read of `getRowModel()` runs your `data` through this
pipeline (results are memoized per state version):

```
data[]
  │
  ▼  column filters      (per-column filterFn / default)
  ▼  global filter       (search across filterable columns)
  ▼  sort                (multi-column, stable, null-safe)
  ▼  group               (optional, by one or more column ids)
  ▼  paginate            (slice to the current page)
  ▼
RowModel { rows, flatRows }
```

- `rows` is the current page as a **tree** — group rows contain `subRows`.
- `flatRows` is the same page **flattened in visual order**, honoring expansion
  (collapsed subtrees are omitted). This is what renderers iterate.

### Client mode vs server mode

Provide **exactly one** data source:

| | `data` (client) | `fetchData` (server) |
| --- | --- | --- |
| Source | An in-memory array | An async page fetcher |
| Filter / sort / paginate | Done by core | Done by *your* backend |
| `getTotalCount()` | Filtered row count | `totalCount` you return |
| Loading / error | n/a | `getIsLoading()` / `getError()` |

In server mode the client-side pipeline is **skipped**: core hands your current
sorting/filters/search/pagination to `fetchData`, and renders exactly the rows
you return.

```ts check
import { createTable } from "@vdnp/tablekit-core";
import type { FetchParams, FetchResult } from "@vdnp/tablekit-core";

interface Order {
  id: number;
  total: number;
}

async function loadOrders(params: FetchParams): Promise<FetchResult<Order>> {
  const query = new URLSearchParams({
    page: String(params.pageIndex),
    size: String(params.pageSize),
    sort: params.sorting.map((s) => `${s.id}:${s.desc ? "desc" : "asc"}`).join(","),
    q: params.globalFilter,
  });
  const response = await fetch(`/api/orders?${query}`);
  const body = (await response.json()) as { items: Order[]; total: number };
  return { rows: body.items, totalCount: body.total };
}

const table = createTable<Order>({
  columns: [{ accessorKey: "id" }, { accessorKey: "total", sortable: true }],
  fetchData: loadOrders,
  getRowId: (order) => String(order.id),
  onError: (error) => console.error(error),
});

// Adapters call mount() in an effect; it kicks off the first fetch and returns
// a cleanup that cancels in-flight work.
const unmount = table.mount();
// ... later:
unmount();
```

**Race protection.** Every fetch gets a monotonic request id. If sorting or the
search box changes while a request is in flight, the older response is discarded
when it resolves — you never see stale rows flash in. You don't configure this;
it's automatic. Rapid synchronous updates (e.g. a filter change that also resets
the page index) are coalesced into a single fetch.

### Controlled vs uncontrolled state

Each state slice can be **owned by you** (controlled) or **owned by core**
(uncontrolled) — independently, per slice. Slices: `sorting`, `columnFilters`,
`globalFilter`, `pagination`, `rowSelection`, `expanded`, `grouping`.

- **Uncontrolled:** omit `state.<slice>`. Core stores it. If you pass an
  `on<Slice>Change` callback it still fires (handy for analytics/persistence).
  Seed a starting value with `initialState`.
- **Controlled:** pass both `state.<slice>` and `on<Slice>Change`. Core never
  mutates it; your callback must write it back for the change to take effect.

```ts check
import { createTable } from "@vdnp/tablekit-core";
import type { PaginationState, SortingState } from "@vdnp/tablekit-core";

interface Row {
  id: number;
}

// Your store — could be React state, a signal, Redux, the URL, etc.
let sorting: SortingState = [];
let pagination: PaginationState = { pageIndex: 0, pageSize: 20 };

const table = createTable<Row>({
  columns: [{ accessorKey: "id", sortable: true }],
  data: [{ id: 1 }],
  // sorting is CONTROLLED: core reads it from `state`; when it changes, your
  // callback persists the value and re-passes options via setOptions().
  state: { sorting },
  onSortingChange: (next) => {
    sorting = next;
  },
  // pagination is UNCONTROLLED: core owns it; the callback is just a notification.
  initialState: { pagination },
  onPaginationChange: (next) => {
    pagination = next;
  },
});
```

> Outside React you re-apply controlled state with `table.setOptions({ …, state:
> { sorting } })` after your store updates. Adapters do this for you on every
> render, so in React you just pass your `useState` setters.

> In React you never wire this by hand — `useDataTable`/`<DataTable />` pass your
> `useState` setters straight through. See
> [@vdnp/tablekit-react](../react/README.md#controlled-state).

## Advanced usage

### Loading, error and refetch (server mode)

```ts check
import { createTable } from "@vdnp/tablekit-core";

const table = createTable<{ id: number }>({
  columns: [{ accessorKey: "id" }],
  fetchData: async () => ({ rows: [{ id: 1 }], totalCount: 1 }),
});
table.mount();

table.getIsLoading(); // boolean — a fetch is in flight
table.getError(); // unknown — last fetch error, cleared on next success
await table.refetch(); // re-run the fetcher with current params
```

`getIsLoading()` / `getError()` are always `false` / `undefined` in client mode.

### Custom sort and filter functions

```ts check
import { createColumnHelper } from "@vdnp/tablekit-core";

interface Person {
  name: string;
  tags: string[];
}

const helper = createColumnHelper<Person>();

const columns = [
  helper.accessor("name", {
    sortable: true,
    // sort by name length instead of alphabetically
    sortFn: (a, b) => a.original.name.length - b.original.name.length,
  }),
  helper.accessor("tags", {
    // match when the row contains the filtered tag
    filterFn: (value, filterValue) =>
      Array.isArray(value) && value.includes(String(filterValue)),
  }),
];
```

### Computed and display columns

```ts check
import { createColumnHelper } from "@vdnp/tablekit-core";

interface Person {
  firstName: string;
  lastName: string;
}

const helper = createColumnHelper<Person>();

const columns = [
  // derived value — id is required for computed columns
  helper.computed("fullName", (person) => `${person.firstName} ${person.lastName}`, {
    header: "Name",
    sortable: true,
  }),
  // display-only column (actions, checkboxes): not tied to a data field
  helper.display({ id: "actions", header: "" }),
];
```

### Subscriptions and versioning

`subscribe(listener)` fires on every state/data change and returns an
unsubscribe. `getVersion()` returns a monotonic counter that bumps on each
change — adapters use it as a cheap `useSyncExternalStore` snapshot instead of
diffing the whole state.

## API reference

Auto-generated type docs live in
[docs/api-reference/core](../../docs/api-reference/core/README.md). The essentials:

### `createTable<TData>(options): Table<TData>`

Key `TableOptions` fields:

| Option | Type | Notes |
| --- | --- | --- |
| `columns` | `ColumnDef<TData>[]` | Required. |
| `data` | `TData[]` | Client mode. Mutually exclusive with `fetchData`. |
| `fetchData` | `(params) => Promise<{ rows, totalCount }>` | Server mode. |
| `getRowId` | `(row, index) => string` | Strongly recommended for selection/expansion stability. |
| `state` | `Partial<TableState>` | Controlled slices. |
| `initialState` | `Partial<TableState>` | Seeds for uncontrolled slices. |
| `on<Slice>Change` | callback | Fires for controlled *and* uncontrolled slices. |
| `onError` | `(error: unknown) => void` | Receives every `fetchData` rejection. |
| `enableMultiSort` | `boolean` (default `true`) | Shift-click multi-column sort. |
| `autoResetPageIndex` | `boolean` (default `true`) | Reset to page 0 on filter/sort change. |

### `Table<TData>` — selected members

- Reads: `getState`, `getRowModel`, `getColumns`, `getColumn`, `getPrePaginationRows`, `getTotalCount`, `getPageCount`, `getVersion`
- Sorting/filtering: `setSorting`, `setColumnFilter(s)`, `setGlobalFilter`
- Pagination: `setPagination`, `setPageIndex`, `setPageSize`, `nextPage`, `previousPage`, `getCanNextPage`, `getCanPreviousPage`
- Selection: `setRowSelection`, `toggleRowSelected`, `toggleAllRowsSelected`, `getSelectedRows`, `getIsAllRowsSelected`, `getIsSomeRowsSelected`
- Expanding/grouping: `setExpanded`, `toggleRowExpanded`, `setGrouping`
- Server mode: `isServerMode`, `getIsLoading`, `getError`, `refetch`
- Lifecycle (adapters): `subscribe`, `mount`, `setOptions`

### `createColumnHelper<TData>()`

Returns `{ accessor, computed, display }` for building fully-typed columns —
`accessor("age", …)` infers the cell value type from the key.

### Exported helpers

`defaultCompare`, `defaultFilterFn`, `sortRows`, `filterRows`, `groupRows`,
`flattenVisibleRows`, `resolveUpdater`, `devWarn`, `resetDevWarnings` — plus the
full type surface (`Table`, `ColumnDef`, `Row`, `TableOptions`, `TableState`,
`FetchParams`, `FetchResult`, …).

## Pitfalls & FAQ

**Do I need `getRowId`?** For read-only tables, no (row index is used). For
selection, expansion or server mode, **yes** — a stable id keeps selection
correct across sorts, filters and page changes.

**Why is my controlled slice "stuck"?** A controlled slice only changes when your
`on<Slice>Change` writes the new value back into `state`. If you pass `state.sorting`
but drop `onSortingChange` (or don't persist it), sorting can't move. Either
control it fully or leave it uncontrolled.

**Do errors get swallowed?** Never. A throwing/rejecting `fetchData` sets
`getError()` and calls `onError`; a malformed result (wrong shape) degrades to an
empty table with a dev warning. Nulls and throwing `accessorFn`s fall back safely.

**Are dev warnings in my production bundle?** No. `devWarn()` is guarded by
`process.env.NODE_ENV !== "production"` and stripped by bundlers.

MIT © TableKit
