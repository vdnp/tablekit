// Explicit named exports only — no wildcard barrels (see CLAUDE.md).
export { useDataTable } from "./use-data-table";
export { DataTable, defaultLabels } from "./data-table";
export type {
  DataTableLabels,
  DataTableProps,
  VirtualListComponent,
  VirtualListProps,
} from "./data-table";
export { cellLayout, formatCellText } from "./helpers";
export type { CellLayout } from "./helpers";

// Re-export the core surface users need to type their columns/handlers.
export { createColumnHelper } from "@tablekit/core";
export type {
  CellContext,
  Column,
  ColumnDef,
  ColumnFiltersState,
  FetchData,
  FetchParams,
  FetchResult,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
  Table,
  TableOptions,
  TableState,
} from "@tablekit/core";
