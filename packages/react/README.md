# @tablekit/react

The React DOM adapter for [`@tablekit/core`](../core). Two ways in:

- **`<DataTable />`** — a styled, accessible table with sorting, search,
  selection, bulk actions, edit/delete, pagination, expansion, pinning, resizing,
  loading/empty/error states and theming built in.
- **`useDataTable()`** — the same engine, headless: you render the markup.

SSR-safe and Next.js App Router ready.

- [Quick start](#quick-start)
- [Core concepts](#core-concepts)
- [Advanced usage](#advanced-usage)
- [Theming & dark mode](#theming--dark-mode)
- [Accessibility](#accessibility)
- [SSR / Next.js](#ssr--nextjs)
- [API reference](#api-reference)
- [Pitfalls & FAQ](#pitfalls--faq)

## Quick start

```bash
npm i @tablekit/react @tablekit/theme
```

Import the stylesheet **once** (e.g. in `app/layout.tsx` or your root):

```ts
import "@tablekit/react/styles.css";
```

```tsx check
import { DataTable, createColumnHelper } from "@tablekit/react";

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
      onRowClick={(row) => console.log(row.original)}
    />
  );
}
```

## Core concepts

### Defining columns

`createColumnHelper<TData>()` keeps columns fully typed against your row type.
Three column kinds:

```tsx check
import { createColumnHelper } from "@tablekit/react";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  salary: number;
  active: boolean;
}

const helper = createColumnHelper<Employee>();

export const columns = [
  // accessor by key — `value` in cell() is inferred (here: number)
  helper.accessor("salary", {
    header: "Salary",
    sortable: true,
    align: "right",
    cell: ({ value }) => `$${value.toLocaleString("en-US")}`,
  }),
  // custom JSX cell
  helper.accessor("active", {
    header: "Status",
    cell: ({ value }) => (
      <span style={{ color: value ? "#15803d" : "#b91c1c" }}>
        {value ? "Active" : "Inactive"}
      </span>
    ),
  }),
  // computed column — needs an explicit id
  helper.computed("fullName", (e) => `${e.firstName} ${e.lastName}`, {
    header: "Name",
    sortable: true,
  }),
];
```

You can also write plain `ColumnDef` objects with `accessorKey` if you prefer —
the helper is optional sugar.

Useful column flags: `sortable`, `filterable`, `resizable`, `pinned`
(`"left" | "right"`), `width` / `minWidth` / `maxWidth`, `align`, and custom
`sortFn` / `filterFn`.

### Component or headless?

`<DataTable />` owns a core instance internally. When you need custom markup,
call `useDataTable()` and render `table.getRowModel().flatRows` yourself:

```tsx check
import { useDataTable } from "@tablekit/react";

interface User {
  id: number;
  name: string;
}

const columns = [{ accessorKey: "name" as const, header: "Name", sortable: true }];

export function CustomList({ users }: { users: User[] }) {
  const table = useDataTable<User>({ columns, data: users, getRowId: (u) => String(u.id) });

  return (
    <div>
      <input
        placeholder="Search"
        onChange={(event) => table.setGlobalFilter(event.target.value)}
      />
      <ul>
        {table.getRowModel().flatRows.map((row) => (
          <li key={row.id}>{row.original.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

You can even keep the default UI but drive state from outside by passing the
instance: `<DataTable table={table} />` (the component then skips its own
mount/options wiring — `useDataTable` already handles both).

### Controlled state

Pass a `state.<slice>` + `on<Slice>Change` pair to control any slice with your
own React state; omit both to let TableKit manage it. Mix freely per slice.

```tsx check
import { DataTable } from "@tablekit/react";
import type { SortingState } from "@tablekit/react";
import { useState } from "react";

interface Row {
  id: number;
  name: string;
}

export function Controlled({ rows }: { rows: Row[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);

  return (
    <DataTable<Row>
      columns={[{ accessorKey: "name", header: "Name", sortable: true }]}
      data={rows}
      getRowId={(row) => String(row.id)}
      state={{ sorting }}
      onSortingChange={setSorting}
    />
  );
}
```

## Advanced usage

### Selection + bulk actions

```tsx check
import { DataTable } from "@tablekit/react";

interface Doc {
  id: number;
  title: string;
}

export function Docs({ docs }: { docs: Doc[] }) {
  return (
    <DataTable<Doc>
      columns={[{ accessorKey: "title", header: "Title" }]}
      data={docs}
      getRowId={(doc) => String(doc.id)}
      enableSelection
      bulkActions={[{ id: "archive", label: "Archive" }]}
      onBulkAction={(actionId, rows) =>
        console.log(actionId, rows.map((row) => row.original.id))
      }
    />
  );
}
```

`enableSelection` adds a checkbox column with an indeterminate select-all in the
header. Select-all respects the active filter (client) / current page (server).

### Row actions (edit / delete)

Providing `onEdit` and/or `onDelete` appends an actions column with buttons;
`onRowClick` makes the whole row clickable (and keyboard-activatable).

```tsx check
import { DataTable } from "@tablekit/react";

interface Item {
  id: number;
  label: string;
}

export function Items({ items }: { items: Item[] }) {
  return (
    <DataTable<Item>
      columns={[{ accessorKey: "label", header: "Label" }]}
      data={items}
      getRowId={(item) => String(item.id)}
      onRowClick={(row) => openItem(row.original)}
      onEdit={(row) => editItem(row.original)}
      onDelete={(row) => removeItem(row.original)}
    />
  );
}

declare function openItem(item: Item): void;
declare function editItem(item: Item): void;
declare function removeItem(item: Item): void;
```

### Pinning & resizing

Set `pinned: "left" | "right"` to stick a column while the table scrolls
horizontally, and `resizable: true` to add a drag handle to its header:

```tsx check
import { createColumnHelper } from "@tablekit/react";

interface Order {
  id: number;
  customer: string;
  total: number;
}

const helper = createColumnHelper<Order>();

export const columns = [
  helper.accessor("id", { header: "Order", width: 110, pinned: "left" }),
  helper.accessor("customer", { header: "Customer", sortable: true, resizable: true }),
  helper.accessor("total", { header: "Total", align: "right" }),
];
```

### Server-side data

Swap `data` for `fetchData` — the props are otherwise identical. The component
shows a skeleton while loading and an error state with a working **Retry** on
failure.

```tsx check
import { DataTable } from "@tablekit/react";
import type { FetchParams, FetchResult } from "@tablekit/react";

interface Order {
  id: number;
  total: number;
}

async function fetchOrders(params: FetchParams): Promise<FetchResult<Order>> {
  const response = await fetch(
    `/api/orders?page=${params.pageIndex}&size=${params.pageSize}&q=${params.globalFilter}`,
  );
  const body = (await response.json()) as { items: Order[]; total: number };
  return { rows: body.items, totalCount: body.total };
}

export function Orders() {
  return (
    <DataTable<Order>
      columns={[
        { accessorKey: "id", header: "Order", sortable: true },
        { accessorKey: "total", header: "Total", align: "right", sortable: true },
      ]}
      fetchData={fetchOrders}
      getRowId={(order) => String(order.id)}
      showGlobalFilter
      onError={(error) => console.error(error)}
    />
  );
}
```

### Custom loading / empty / error / expanded rows

Every visual state accepts your own component:

```tsx check
import { DataTable } from "@tablekit/react";

interface Row {
  id: number;
  name: string;
}

export function WithCustomStates({ rows }: { rows: Row[] }) {
  return (
    <DataTable<Row>
      columns={[{ accessorKey: "name", header: "Name" }]}
      data={rows}
      getRowId={(row) => String(row.id)}
      renderLoading={() => <MySkeleton />}
      renderEmpty={() => <p>Nothing here yet.</p>}
      renderError={(error, retry) => (
        <div role="alert">
          <p>{String(error)}</p>
          <button onClick={() => void retry()}>Try again</button>
        </div>
      )}
      renderExpandedRow={(row) => <pre>{JSON.stringify(row.original, null, 2)}</pre>}
    />
  );
}

declare function MySkeleton(): JSX.Element;
```

`renderExpandedRow` also adds an expander column; call `row.toggleExpanded()`
from your own cells if you want a custom trigger.

## Theming & dark mode

The stylesheet is driven entirely by `--tk-*` CSS variables with light-mode
fallbacks. Three levels of control:

**1. Built-in dark scheme** — no setup:

```tsx
<DataTable colorScheme="dark" columns={columns} data={data} />
```

**2. A theme token object** (from [`@tablekit/theme`](../theme)) applied as CSS
variables on the root element:

```tsx check
import { DataTable } from "@tablekit/react";
import { darkTheme } from "@tablekit/theme";

export function Themed({ rows }: { rows: { id: number }[] }) {
  return (
    <DataTable
      columns={[{ accessorKey: "id", header: "ID" }]}
      data={rows}
      theme={darkTheme}
    />
  );
}
```

**3. Raw CSS** — override any variable on an ancestor:

```css
.my-app {
  --tk-color-accent: #0ea5e9;
  --tk-radius-container: 4px;
}
```

See [@tablekit/theme](../theme/README.md) for the full token list.

## Accessibility

Behavior you (and your users) get for free:

- Sortable headers are real `<button>`s and expose `aria-sort`
  (`ascending`/`descending`) that updates as you sort.
- The selection column uses proper checkboxes with an **indeterminate**
  select-all; rows expose `aria-selected`.
- When `onRowClick` is set, rows are focusable and respond to **Enter/Space**
  (activate) and **↑/↓** (move focus between rows).
- The error state is a `role="alert"`; pagination info is a live region.
- Animations respect `prefers-reduced-motion`.
- Pass `caption` for a visually-hidden `<caption>` describing the table.

## SSR / Next.js

Everything in this package is a Client Component (`"use client"` is baked into
the build). `createTable()` runs during SSR without side effects, and
`useSyncExternalStore` supplies a stable server snapshot, so the first paint
matches the client and there are **no hydration mismatches**. Server-mode
fetching starts in an effect (client only).

Put `<DataTable />` (or your `useDataTable` component) in a Client Component, keep
your data-loading Server Components around it. Full walkthrough:
[docs/guides/nextjs.md](../../docs/guides/nextjs.md).

## API reference

Generated types: [docs/api-reference/react](../../docs/api-reference/react/README.md).

### `<DataTable<TData> />` props

Extends `TableOptions<TData>` (so `columns`, `data`/`fetchData`, `getRowId`,
`state`, `initialState`, `on*Change`, `onError`, … all pass through) and adds:

| Prop | Type | Purpose |
| --- | --- | --- |
| `table` | `Table<TData>` | Use a prebuilt instance from `useDataTable` (headless bridge). |
| `onRowClick` | `(row) => void` | Row click + keyboard activation. |
| `onEdit` / `onDelete` | `(row) => void` | Adds an actions column. |
| `enableSelection` | `boolean` | Checkbox column + select-all. |
| `bulkActions` / `onBulkAction` | `BulkAction[]` / `(id, rows) => void` | Bulk bar. |
| `showGlobalFilter` | `boolean` | Search input above the table. |
| `showPagination` | `boolean` (default `true`) | Pagination footer. |
| `pageSizeOptions` | `number[]` | Page-size dropdown values. |
| `renderLoading` / `renderEmpty` / `renderError` | render fns | Replace default states. |
| `renderExpandedRow` | `(row) => ReactNode` | Detail row + expander column. |
| `theme` / `colorScheme` | `ThemeTokens` / `"light" \| "dark"` | Theming. |
| `className` / `caption` / `labels` | | Styling & i18n of built-in strings. |

### Exports

`useDataTable`, `DataTable`, `defaultLabels`, `formatCellValue`, `renderSlot`,
`createColumnHelper`, and the core types you need to type columns and handlers
(`ColumnDef`, `Row`, `Table`, `SortingState`, `FetchParams`, `FetchResult`, …).

## Pitfalls & FAQ

**Nothing renders / styles look off.** Import `@tablekit/react/styles.css` once
at your app root.

**Columns/data recreate every render.** Define `columns` at module scope or wrap
in `useMemo`, and keep `data` referentially stable — otherwise you defeat
memoization. `getRowId` should be stable too.

**Selection resets after refetch.** Provide `getRowId`; without a stable id,
selection is keyed by array index and won't survive re-ordering.

**"use client" errors in Next.js.** Render `<DataTable />` inside a Client
Component. Don't call `useDataTable` in a Server Component.

MIT © TableKit
