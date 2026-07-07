# Using TableKit with Next.js (App Router)

TableKit works with the Next.js App Router out of the box. This guide shows the
client-mode and server-mode setups exactly as they appear in
[`examples/nextjs-app`](../../examples/nextjs-app), which also serves as the
project's SSR integration test.

- [Install & global setup](#install--global-setup)
- [Client-mode table](#client-mode-table)
- [Server-mode table](#server-mode-table)
- [Where the client boundary goes](#where-the-client-boundary-goes)
- [Avoiding hydration mismatches](#avoiding-hydration-mismatches)

## Install & global setup

```bash
pnpm add @tablekit/react @tablekit/theme
```

Import the stylesheet once in the root layout (a Server Component — importing CSS
here is fine):

```tsx
// app/layout.tsx
import type { ReactNode } from "react";
import "@tablekit/react/styles.css";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Your page can stay a Server Component; it renders the table components, which are
themselves Client Components:

```tsx
// app/page.tsx  (Server Component — no "use client")
import { ClientTableDemo } from "./client-table-demo";
import { ServerTableDemo } from "./server-table-demo";

export default function HomePage() {
  return (
    <main>
      <ClientTableDemo />
      <ServerTableDemo />
    </main>
  );
}
```

## Client-mode table

For data you already have on the client (or passed down from a Server Component),
use the `data` prop. Mark the file `"use client"`.

```tsx
// app/client-table-demo.tsx
"use client";

import { DataTable, createColumnHelper } from "@tablekit/react";
import { darkTheme } from "@tablekit/theme";
import { useMemo, useState } from "react";

interface Employee {
  id: number;
  name: string;
  department: string;
  salary: number;
  active: boolean;
}

const helper = createColumnHelper<Employee>();

export function ClientTableDemo({ employees }: { employees: Employee[] }) {
  const [dark, setDark] = useState(false);

  const columns = useMemo(
    () => [
      helper.accessor("name", { header: "Name", sortable: true, width: 200, pinned: "left" }),
      helper.accessor("department", { header: "Department", sortable: true }),
      helper.accessor("salary", {
        header: "Salary",
        sortable: true,
        align: "right",
        cell: ({ value }) => `$${value.toLocaleString("en-US")}`,
      }),
      helper.accessor("active", {
        header: "Status",
        cell: ({ value }) => (value ? "Active" : "Inactive"),
      }),
    ],
    [],
  );

  return (
    <DataTable<Employee>
      columns={columns}
      data={employees}
      getRowId={(employee) => String(employee.id)}
      initialState={{ pagination: { pageIndex: 0, pageSize: 10 } }}
      enableSelection
      showGlobalFilter
      caption="Employee directory"
      theme={dark ? darkTheme : undefined}
      colorScheme={dark ? "dark" : "light"}
      bulkActions={[{ id: "export", label: "Export" }]}
      onBulkAction={(action, rows) => console.log(action, rows.length)}
    />
  );
}
```

> Define `columns` at module scope or wrap them in `useMemo`, and keep `data`
> referentially stable — this preserves TableKit's internal memoization.

## Server-mode table

For data that lives on your backend, pass `fetchData` instead of `data`. Sorting,
filtering and pagination are handed to your fetcher; you return the page plus a
total count. The component renders a skeleton while loading and an error state
with a working **Retry** on failure.

```tsx
// app/server-table-demo.tsx
"use client";

import { DataTable, createColumnHelper } from "@tablekit/react";
import type { FetchParams, FetchResult } from "@tablekit/react";
import { useCallback } from "react";

interface Order {
  id: number;
  customer: string;
  total: number;
  status: string;
}

const helper = createColumnHelper<Order>();
const columns = [
  helper.accessor("id", { header: "Order", sortable: true, width: 110 }),
  helper.accessor("customer", { header: "Customer", sortable: true }),
  helper.accessor("total", {
    header: "Total",
    sortable: true,
    align: "right",
    cell: ({ value }) => `$${value.toFixed(2)}`,
  }),
  helper.accessor("status", { header: "Status" }),
];

export function ServerTableDemo() {
  const fetchData = useCallback(
    async (params: FetchParams): Promise<FetchResult<Order>> => {
      const query = new URLSearchParams({
        page: String(params.pageIndex),
        size: String(params.pageSize),
        sort: params.sorting.map((s) => `${s.id}:${s.desc ? "desc" : "asc"}`).join(","),
        q: params.globalFilter,
      });
      const response = await fetch(`/api/orders?${query}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = (await response.json()) as { items: Order[]; total: number };
      return { rows: body.items, totalCount: body.total };
    },
    [],
  );

  return (
    <DataTable<Order>
      columns={columns}
      fetchData={fetchData}
      getRowId={(order) => String(order.id)}
      showGlobalFilter
      caption="Orders (server-side)"
      onError={(error) => console.error("[orders] fetch failed:", error)}
      pageSizeOptions={[10, 25, 50]}
    />
  );
}
```

Wrap `fetchData` in `useCallback` (or define it at module scope) so its identity
is stable across renders.

### Route Handler sketch

The `/api/orders` endpoint reads the same params and returns `{ items, total }`:

```ts
// app/api/orders/route.ts
export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 0);
  const size = Number(url.searchParams.get("size") ?? 10);
  const { items, total } = await queryOrders({ page, size /* , sort, q */ });
  return Response.json({ items, total });
}

declare function queryOrders(args: { page: number; size: number }): Promise<{
  items: unknown[];
  total: number;
}>;
```

## Where the client boundary goes

- **Server Components:** layout, pages, data fetching, and passing serializable
  props down.
- **Client Components (`"use client"`):** any file that renders `<DataTable />`
  or calls `useDataTable()`. TableKit's build already marks its own modules
  `"use client"`, but *your* file that imports and uses them must be a Client
  Component too, because it uses hooks and event handlers.

You do **not** need to wrap TableKit in `next/dynamic` or disable SSR — it renders
correctly on the server.

## Avoiding hydration mismatches

TableKit is designed so the server-rendered markup matches the client's first
render:

- `createTable()` has **no side effects** — no `window`/`document` access at
  module or render time.
- Adapters subscribe via `useSyncExternalStore` with a **server snapshot**, so
  the initial render is deterministic on both sides.
- Server-mode fetching starts in a `useEffect` (client only). During SSR a
  server-mode table renders its loading state; the first fetch runs after
  hydration.

Practical rules to keep it that way:

1. Don't feed the table values that differ between server and client on first
   render (e.g. `Date.now()`, `Math.random()`, `localStorage`) unless you gate
   them behind an effect.
2. Keep `getRowId` deterministic.
3. If you persist table state to `localStorage`/URL, read it in an effect (or via
   Next's server-readable APIs) and treat the first render as the default state —
   don't branch markup on client-only storage during render.

The `examples/nextjs-app` project builds with `next build` as part of CI, so these
guarantees are continuously verified.
