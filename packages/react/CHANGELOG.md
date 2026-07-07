# @vdnp/tablekit-react

## 0.1.0-beta.0

### Minor Changes

- 80abd30: Initial release of the TableKit family:

  - `@vdnp/tablekit-core`: headless, dependency-free table engine — sorting,
    column/global filtering, pagination, row selection, expanding, grouping;
    client-side arrays or server-side `fetchData` with race protection and
    first-class error state; controlled/uncontrolled state slices.
  - `@vdnp/tablekit-react`: SSR-safe `useDataTable()` hook and accessible
    `<DataTable />` for web/Next.js with selection, bulk actions, actions
    column, pinning, resizing, skeleton/empty/error render slots and theming
    via CSS variables.
  - `@vdnp/tablekit-react-native`: FlatList-based `<DataTable />` (FlashList
    injectable) sharing the same hook contract and core.
  - `@vdnp/tablekit-theme`: shared design tokens with built-in light/dark themes.

### Patch Changes

- Updated dependencies [80abd30]
  - @vdnp/tablekit-core@0.1.0-beta.0
  - @vdnp/tablekit-theme@0.1.0-beta.0
