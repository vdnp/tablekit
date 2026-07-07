---
"@tablekit/core": minor
"@tablekit/react": minor
"@tablekit/react-native": minor
"@tablekit/theme": minor
---

Initial release of the TableKit family:

- `@tablekit/core`: headless, dependency-free table engine — sorting,
  column/global filtering, pagination, row selection, expanding, grouping;
  client-side arrays or server-side `fetchData` with race protection and
  first-class error state; controlled/uncontrolled state slices.
- `@tablekit/react`: SSR-safe `useDataTable()` hook and accessible
  `<DataTable />` for web/Next.js with selection, bulk actions, actions
  column, pinning, resizing, skeleton/empty/error render slots and theming
  via CSS variables.
- `@tablekit/react-native`: FlatList-based `<DataTable />` (FlashList
  injectable) sharing the same hook contract and core.
- `@tablekit/theme`: shared design tokens with built-in light/dark themes.
