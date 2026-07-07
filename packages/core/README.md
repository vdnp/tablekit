# @tablekit/core

Platform-agnostic, dependency-free data table engine. No React, no DOM — just
state and derived row models. Rendered by [`@tablekit/react`](../react) and
[`@tablekit/react-native`](../react-native), or by your own adapter.

## Model

```
data[] → column filters → global filter → sort → group → paginate → RowModel
```

With `fetchData` instead of `data`, the pipeline is skipped and the engine
orchestrates fetches (race-protected, error-capturing) whenever
sorting/filters/search/pagination change.

## Usage

```ts
import { createTable, createColumnHelper } from "@tablekit/core";

interface User { id: number; name: string; age: number }

const helper = createColumnHelper<User>();

const table = createTable<User>({
  columns: [
    helper.accessor("name", { sortable: true }),
    helper.accessor("age", { sortable: true }),
    helper.computed("initial", (user) => user.name[0] ?? ""),
  ],
  data: users,
  getRowId: (user) => String(user.id),
});

table.subscribe(() => render(table.getRowModel().flatRows));
table.setSorting([{ id: "age", desc: true }]);
table.setGlobalFilter("an");
table.nextPage();
```

### Server mode

```ts
const table = createTable<User>({
  columns,
  fetchData: async ({ pageIndex, pageSize, sorting, columnFilters, globalFilter }) => {
    const page = await api.users({ pageIndex, pageSize, sorting, globalFilter });
    return { rows: page.items, totalCount: page.total };
  },
  onError: (error) => report(error),
});

const unmount = table.mount(); // starts the first fetch — adapters call this in an effect
table.getIsLoading();          // fetch in flight?
table.getError();              // last error (cleared on next success)
await table.refetch();
```

`createTable()` itself performs **no side effects** — safe to call during SSR.

### Controlled state

Any slice can be owned by the caller:

```ts
createTable({ columns, data, state: { sorting }, onSortingChange: setSorting });
```

Omit both and the engine keeps the slice internal (callbacks still fire if
provided). Slices: `sorting`, `columnFilters`, `globalFilter`, `pagination`,
`rowSelection`, `expanded`, `grouping`.

## Resilience guarantees

- `null`/`undefined` cells never throw; they sort last and stringify to `""`.
- A throwing `accessorFn` yields `undefined` for that cell (+ dev warning).
- Malformed `fetchData` results degrade to an empty table (+ dev warning).
- Stale async responses are discarded; `fetchData` errors always reach
  `getError()` and `onError` — never swallowed.
- Misuse (duplicate ids, missing accessors, `data`+`fetchData` together)
  warns in development, stays silent in production.

## API surface

`createTable`, `createColumnHelper`, `defaultCompare`, `defaultFilterFn`,
`sortRows`, `filterRows`, `groupRows`, `flattenVisibleRows`, plus the full
type surface (`Table`, `ColumnDef`, `Row`, `TableOptions`, `TableState`, …).
Everything is strictly typed and generic over your row type — `accessorKey`
is constrained to `keyof TData`.

MIT © TableKit
