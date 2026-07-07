# @tablekit/react

React DOM adapter for [`@tablekit/core`](../core). Two entry points:

- **`<DataTable />`** — batteries included: sorting UI, global search,
  selection + bulk actions, edit/delete actions column, pagination footer,
  skeleton/empty/error states, pinning, resizing, dark mode.
- **`useDataTable()`** — headless: the same engine, your markup.

SSR-safe (Next.js App Router ready): every module is marked `"use client"`,
no `window`/`document` at module scope, fetching starts in an effect.

## Install

```bash
pnpm add @tablekit/react
```

```tsx
import "@tablekit/react/styles.css"; // once, e.g. in app/layout.tsx
```

## Component

```tsx
"use client";
import { DataTable, createColumnHelper } from "@tablekit/react";

const helper = createColumnHelper<Order>();
const columns = [
  helper.accessor("id", { header: "Order", sortable: true, width: 110, pinned: "left" }),
  helper.accessor("total", {
    header: "Total",
    sortable: true,
    align: "right",
    cell: ({ value }) => `$${value.toFixed(2)}`, // value: number — inferred
  }),
];

<DataTable<Order>
  columns={columns}
  data={orders}                          // or fetchData={...} for server mode
  getRowId={(order) => String(order.id)}
  enableSelection
  showGlobalFilter
  bulkActions={[{ id: "archive", label: "Archive" }]}
  onBulkAction={(action, rows) => archive(rows.map((row) => row.original))}
  onRowClick={(row) => open(row.original)}
  onEdit={(row) => edit(row.original)}
  onDelete={(row) => remove(row.original)}
  renderEmpty={() => <EmptyIllustration />}
  renderError={(error, retry) => <ApiError error={error} onRetry={retry} />}
  renderLoading={() => <MySkeleton />}
  renderExpandedRow={(row) => <OrderDetails order={row.original} />}
  caption="Orders"
  colorScheme="dark"                      // or theme={customTokens}
/>
```

All render props are optional — sensible accessible defaults are built in.

## Headless

```tsx
const table = useDataTable<Order>({ columns, data, getRowId });
// full control:
table.getRowModel().flatRows;
table.getColumn("total")?.toggleSorting();
table.setColumnFilter("status", "shipped");
```

You can also hand that instance to the component (`<DataTable table={table} />`)
to keep the default UI while driving state from outside.

## Theming

The stylesheet reads `--tk-*` CSS variables with light-mode fallbacks.
Override any subset on an ancestor, or generate a full set from tokens:

```tsx
import { darkTheme, themeToCssVariables } from "@tablekit/theme";
<div style={themeToCssVariables(darkTheme)}>…</div>
```

`colorScheme="dark"` activates the built-in dark palette without any setup.

## Accessibility

`aria-sort` on headers, real `<button>`s for sorting, checkbox column with
indeterminate select-all, `aria-selected` rows, keyboard row navigation
(↑/↓/Enter when `onRowClick` is set), `role="alert"` error state, live-region
page info, `prefers-reduced-motion` respected.

MIT © TableKit
