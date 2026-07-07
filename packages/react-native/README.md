# @tablekit/react-native

The React Native adapter for [`@tablekit/core`](../core) — the **same headless
engine and hook contract** as [`@tablekit/react`](../react), rendered with native
primitives and virtualized through `FlatList` (or FlashList, injected).

- [Quick start](#quick-start)
- [Core concepts](#core-concepts)
- [Advanced usage](#advanced-usage)
- [Theming](#theming)
- [Accessibility](#accessibility)
- [Known limitations](#known-limitations)
- [API reference](#api-reference)

## Quick start

```bash
npm i @tablekit/react-native @tablekit/theme
# recommended for large lists:
npm i @shopify/flash-list
```

Requires **React Native ≥ 0.72** and **React ≥ 18**. `react` and `react-native`
are peer dependencies.

```tsx
import { DataTable, createColumnHelper } from "@tablekit/react-native";

interface Player {
  id: number;
  name: string;
  team: string;
  points: number;
}

const helper = createColumnHelper<Player>();
const columns = [
  helper.accessor("name", { header: "Name", sortable: true, width: 140 }),
  helper.accessor("team", { header: "Team", sortable: true }),
  helper.accessor("points", { header: "Pts", sortable: true, align: "right", width: 70 }),
];

export function Roster({ players }: { players: Player[] }) {
  return (
    <DataTable<Player>
      columns={columns}
      data={players}
      getRowId={(player) => String(player.id)}
      showGlobalFilter
      onRowPress={(row) => console.log(row.original.name)}
    />
  );
}
```

## Core concepts

### Same core, native gestures

The column API, state model and `useDataTable()` hook are identical to the web
adapter — only the interaction idioms change to match the platform:

| Web (`@tablekit/react`) | React Native (`@tablekit/react-native`) |
| --- | --- |
| `onRowClick` | `onRowPress` |
| — | `onRowLongPress` (native context-action idiom) |
| CSS `styles.css` + CSS variables | `theme` / `colorScheme` token objects |
| `resizable` drag handle | not applicable (fixed / flex widths) |

Everything else — `enableSelection`, `bulkActions` / `onBulkAction`,
`showGlobalFilter`, `showPagination`, `renderLoading` / `renderEmpty` /
`renderError`, `renderExpandedRow`, controlled/uncontrolled `state`, server-mode
`fetchData` — works exactly as on the web.

### Headless usage

Identical to the web hook — render with native components:

```tsx
import { useDataTable } from "@tablekit/react-native";
import { FlatList, Text, View } from "react-native";

interface Player {
  id: number;
  name: string;
}

export function CustomList({ players }: { players: Player[] }) {
  const table = useDataTable<Player>({
    columns: [{ accessorKey: "name", header: "Name" }],
    data: players,
    getRowId: (player) => String(player.id),
  });

  return (
    <FlatList
      data={table.getRowModel().flatRows}
      keyExtractor={(row) => row.id}
      renderItem={({ item }) => (
        <View>
          <Text>{item.original.name}</Text>
        </View>
      )}
    />
  );
}
```

### Column widths

Columns with an explicit `width` are fixed; columns without one share the
remaining space (`flex: 1`). Past `minTableWidth`, the table scrolls
horizontally inside a `ScrollView`.

## Advanced usage

### Injecting FlashList

`<DataTable />` renders rows through `FlatList` by default. For large data sets,
pass FlashList from `@shopify/flash-list` via `ListComponent` — the package
depends on neither `FlatList` internals nor FlashList directly, it just needs a
component matching the `VirtualListComponent` shape:

```tsx
import { DataTable } from "@tablekit/react-native";
import type { Row, VirtualListComponent } from "@tablekit/react-native";
import { FlashList } from "@shopify/flash-list";

interface Player {
  id: number;
  name: string;
}

export function BigRoster({ players }: { players: Player[] }) {
  return (
    <DataTable<Player>
      columns={[{ accessorKey: "name", header: "Name", sortable: true }]}
      data={players}
      getRowId={(player) => String(player.id)}
      ListComponent={FlashList as unknown as VirtualListComponent<Row<Player>>}
    />
  );
}
```

The `as unknown as VirtualListComponent<Row<Player>>` cast bridges FlashList's
generic props to our minimal structural interface; it is safe because we only use
`data`, `renderItem`, `keyExtractor`, `extraData` and `ListEmptyComponent`.

### Server-side data

Same `fetchData` contract as core/web — the component shows an `ActivityIndicator`
while loading and a native error view with a Retry button on failure:

```tsx
import { DataTable } from "@tablekit/react-native";
import type { FetchParams, FetchResult } from "@tablekit/react-native";

interface Order {
  id: number;
  total: number;
}

async function fetchOrders(params: FetchParams): Promise<FetchResult<Order>> {
  const response = await fetch(
    `https://api.example.com/orders?page=${params.pageIndex}&size=${params.pageSize}`,
  );
  const body = (await response.json()) as { items: Order[]; total: number };
  return { rows: body.items, totalCount: body.total };
}

export function Orders() {
  return (
    <DataTable<Order>
      columns={[{ accessorKey: "id", header: "Order", sortable: true }]}
      fetchData={fetchOrders}
      getRowId={(order) => String(order.id)}
      onError={(error) => console.warn(error)}
    />
  );
}
```

## Theming

Styling comes from [`@tablekit/theme`](../theme) token objects — no StyleSheet
overrides needed. Use the built-in dark palette or a custom token set:

```tsx
import { DataTable } from "@tablekit/react-native";
import { lightTheme } from "@tablekit/theme";
import type { ThemeTokens } from "@tablekit/theme";

const brand: ThemeTokens = {
  ...lightTheme,
  colors: { ...lightTheme.colors, accent: "#0ea5e9" },
};

export function Branded({ rows }: { rows: { id: number }[] }) {
  return (
    <DataTable
      columns={[{ accessorKey: "id", header: "ID" }]}
      data={rows}
      theme={brand}
    />
  );
}
```

`colorScheme="dark"` switches to the built-in dark tokens with no other setup.

## Accessibility

Native accessibility maps to the same semantics as the web:

| Element | Native a11y |
| --- | --- |
| Selection checkbox | `accessibilityRole="checkbox"` + `accessibilityState={{ checked }}` |
| Sortable header | `accessibilityRole="button"` + `accessibilityState={{ selected }}` |
| Row (selectable) | `accessibilityState={{ selected }}` |
| Group / expander | `accessibilityRole="button"` + `accessibilityState={{ expanded }}` |
| Error view | `accessibilityRole="alert"` |
| Pagination info | `accessibilityLiveRegion="polite"` |

Screen readers (VoiceOver / TalkBack) announce sort state, selection and page
changes accordingly.

## Known limitations

- **Component tests** aren't run in CI: React Native ships untranspiled Flow
  source that Vitest can't parse. The package is verified by `tsc` type-check
  (against react-native 0.76 types) plus unit tests of its pure helpers
  (`cellLayout`, `formatCellText`). Full component tests need a Jest +
  `react-native` preset harness (planned before 1.0). Doc snippets here are
  hand-verified for the same reason.
- **Column resizing** is web-only (no drag handle on native).
- **Horizontal scroll** is required for wide tables; size columns with `width`
  and set `minTableWidth` to tune the breakpoint.

## API reference

Generated types: [docs/api-reference/react-native](../../docs/api-reference/react-native/README.md).

### `<DataTable<TData> />` props

Extends `TableOptions<TData>` and adds: `table`, `onRowPress`, `onRowLongPress`,
`enableSelection`, `bulkActions` / `onBulkAction`, `showGlobalFilter`,
`showPagination`, `renderLoading` / `renderEmpty` / `renderError`,
`renderExpandedRow`, `theme` / `colorScheme`, `labels`, `ListComponent`,
`minTableWidth`.

### Exports

`useDataTable`, `DataTable`, `defaultLabels`, `cellLayout`, `formatCellText`,
`createColumnHelper`, the `VirtualListComponent` / `VirtualListProps` /
`CellLayout` types, and the re-exported core types (`ColumnDef`, `Row`, `Table`,
`FetchParams`, `FetchResult`, …).

MIT © TableKit
