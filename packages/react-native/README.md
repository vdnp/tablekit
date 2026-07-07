# @tablekit/react-native

React Native adapter for [`@tablekit/core`](../core) — the same headless
engine and hook contract as `@tablekit/react`, rendered with native
primitives and virtualized through `FlatList` (or FlashList, injected).

## Install

```bash
pnpm add @tablekit/react-native
# optional, recommended for large lists:
pnpm add @shopify/flash-list
```

## Usage

```tsx
import { DataTable, createColumnHelper } from "@tablekit/react-native";
import type { Row, VirtualListComponent } from "@tablekit/react-native";
import { FlashList } from "@shopify/flash-list";

const helper = createColumnHelper<Player>();
const columns = [
  helper.accessor("name", { header: "Name", sortable: true, width: 140 }),
  helper.accessor("points", { header: "Pts", sortable: true, align: "right" }),
];

<DataTable<Player>
  columns={columns}
  data={players}                    // or fetchData={...} for server mode
  getRowId={(player) => String(player.id)}
  enableSelection
  showGlobalFilter
  colorScheme="dark"                // or theme={customTokens} from @tablekit/theme
  onRowPress={(row) => navigate(row.original)}
  onRowLongPress={(row) => showActions(row.original)}
  ListComponent={FlashList as unknown as VirtualListComponent<Row<Player>>}
/>
```

Headless usage is identical to the web:

```tsx
const table = useDataTable<Player>({ columns, data, getRowId });
```

## Notes

- Styling comes from `@tablekit/theme` token objects — pass `theme` for a
  custom look; no StyleSheet overrides needed.
- Columns without `width` share remaining space (`flex: 1`); the table
  scrolls horizontally past `minTableWidth`.
- Accessibility: checkbox/button roles, `accessibilityState` for
  checked/expanded/selected, live-region page info.
- Component tests require a Jest + `react-native` preset harness (RN ships
  untranspiled Flow source that Vitest can't parse); pure helpers are
  unit-tested here and the package is type-checked against RN 0.76 types.

MIT © TableKit
