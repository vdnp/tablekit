"use client";

// Explicit named exports only — no wildcard barrels (see CLAUDE.md).
export { useDataTable } from "./use-data-table";
export { DataTable, defaultLabels } from "./data-table";
export type { BulkAction, DataTableLabels, DataTableProps } from "./data-table";
export { formatCellValue, renderSlot } from "./render-slot";

// Re-export the core surface users need to type their columns/handlers,
// so `@tablekit/react` works standalone without importing core directly.
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
