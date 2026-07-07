# TableKit

Universal, headless DataTable for **React**, **Next.js** and **React Native** —
one platform-agnostic core, thin platform adapters.

| Package | What it is |
| --- | --- |
| [`@tablekit/core`](packages/core) | Headless engine: sorting, filtering (column + global), pagination, row selection, expanding, grouping. Zero dependencies, zero React. Client-side arrays **or** server-side `fetchData`. |
| [`@tablekit/react`](packages/react) | DOM renderer: `useDataTable()` hook + accessible `<DataTable />`. SSR-safe, App Router ready. |
| [`@tablekit/react-native`](packages/react-native) | `FlatList`-based renderer (FlashList injectable), same hook contract. |
| [`@tablekit/theme`](packages/theme) | Design tokens + light/dark themes, shared by both renderers. |

## Quick start (web)

```tsx
"use client";
import { DataTable, createColumnHelper } from "@tablekit/react";
import "@tablekit/react/styles.css";

interface User { id: number; name: string; age: number }

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
      enableSelection
      showGlobalFilter
      onRowClick={(row) => console.log(row.original)}
    />
  );
}
```

Server-side data? Swap `data` for a fetcher — same component:

```tsx
<DataTable<User>
  columns={columns}
  fetchData={async ({ pageIndex, pageSize, sorting, columnFilters, globalFilter }) => {
    const response = await api.users({ pageIndex, pageSize, sorting, globalFilter });
    return { rows: response.items, totalCount: response.total };
  }}
  onError={(error) => toast.error(String(error))}
/>
```

Headless? Take the hook, keep your markup:

```tsx
const table = useDataTable<User>({ columns, data });
return table.getRowModel().flatRows.map((row) => <MyRow key={row.id} row={row} />);
```

## Repository

```
packages/core          engine (no React)
packages/react         web adapter
packages/react-native  native adapter
packages/theme         design tokens
examples/nextjs-app    App Router demo + SSR integration test
examples/expo-app      RN demo (source-only, outside the workspace)
```

```bash
pnpm install
pnpm build        # all packages (turbo)
pnpm test         # core + adapters
pnpm typecheck
pnpm -F nextjs-app build   # end-to-end SSR check
```

Development conventions, architecture rules and release flow live in
[CLAUDE.md](CLAUDE.md). Versioning uses [Changesets](https://github.com/changesets/changesets).

## License

MIT
