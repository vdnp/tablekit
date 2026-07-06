// Explicit named exports only — no wildcard barrels (see CLAUDE.md).
export { createTable } from "./create-table";
export { createColumnHelper } from "./column-helper";
export type { ColumnHelper } from "./column-helper";
export { defaultCompare, sortRows } from "./features/sorting";
export { defaultFilterFn, filterRows } from "./features/filtering";
export { flattenVisibleRows, groupRows } from "./features/grouping";
export { devWarn, resetDevWarnings } from "./utils/dev";
export { resolveUpdater } from "./utils/updater";
export type {
  CellContext,
  Column,
  ColumnAlign,
  ColumnDef,
  ColumnFilter,
  ColumnFiltersState,
  ColumnPin,
  ColumnSort,
  ExpandedState,
  FetchData,
  FetchParams,
  FetchResult,
  GroupingState,
  HeaderContext,
  PaginationState,
  Row,
  RowModel,
  RowSelectionState,
  SortDirection,
  SortingState,
  Table,
  TableOptions,
  TableState,
  Updater,
} from "./types";
