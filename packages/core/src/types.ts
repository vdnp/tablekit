/**
 * Public type surface of @vdnp/tablekit-core.
 *
 * Core is renderer-agnostic: render slots (`header`, `cell`) return `unknown`
 * and are narrowed to platform node types by the adapters. Render slots are
 * declared with method syntax on purpose — method positions are bivariant, so
 * a `ColumnDef<TData, number>` remains assignable to `ColumnDef<TData, unknown>`
 * without resorting to `any`.
 */

export type SortDirection = "asc" | "desc";

export interface ColumnSort {
  /** Column id being sorted. */
  id: string;
  desc: boolean;
}

export type SortingState = readonly ColumnSort[];

export interface ColumnFilter {
  /** Column id being filtered. */
  id: string;
  value: unknown;
}

export type ColumnFiltersState = readonly ColumnFilter[];

export interface PaginationState {
  /** Zero-based page index. */
  pageIndex: number;
  pageSize: number;
}

/** Map of row id → selected. Absent keys mean "not selected". */
export type RowSelectionState = Readonly<Record<string, boolean>>;

/** Map of row id → expanded. Absent keys mean "collapsed". */
export type ExpandedState = Readonly<Record<string, boolean>>;

/** Ordered list of column ids to group by (outermost first). */
export type GroupingState = readonly string[];

export interface TableState {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
  pagination: PaginationState;
  rowSelection: RowSelectionState;
  expanded: ExpandedState;
  grouping: GroupingState;
}

/** React-style updater: either the next value or a function of the previous one. */
export type Updater<T> = T | ((previous: T) => T);

export type ColumnAlign = "left" | "center" | "right";
export type ColumnPin = "left" | "right" | false;

export interface HeaderContext<TData> {
  column: Column<TData>;
  table: Table<TData>;
}

export interface CellContext<TData, TValue = unknown> {
  row: Row<TData>;
  column: Column<TData>;
  table: Table<TData>;
  /** The accessed value for this cell (result of accessorKey/accessorFn). */
  value: TValue;
}

export interface ColumnDef<TData, TValue = unknown> {
  /**
   * Unique column id. Optional when `accessorKey` is provided (the key is
   * used as the id). Required for columns that only use `accessorFn`.
   */
  id?: string;
  /** Static header label, or a render slot narrowed by the adapter. */
  header?: string | (() => unknown);
  /** Field to read from each row — compile-time constrained to keys of TData. */
  accessorKey?: keyof TData & string;
  /** Derived value accessor. Takes precedence over `accessorKey`. */
  accessorFn?(row: TData, index: number): TValue;
  /** Custom cell render slot; adapters narrow the return type to their node type. */
  cell?(context: CellContext<TData, TValue>): unknown;
  /** Enable click-to-sort UI for this column. Default: false. */
  sortable?: boolean;
  /** Include this column in column/global filtering UI. Default: true for accessor columns. */
  filterable?: boolean;
  /** Allow the user to resize this column (web adapter). Default: false. */
  resizable?: boolean;
  pinned?: ColumnPin;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: ColumnAlign;
  /** Custom comparator. Return negative/zero/positive like Array.prototype.sort. */
  sortFn?(a: Row<TData>, b: Row<TData>, columnId: string): number;
  /** Custom filter predicate for this column. */
  filterFn?(value: unknown, filterValue: unknown, row: Row<TData>): boolean;
  /** Free-form escape hatch for adapter/user metadata. */
  meta?: Readonly<Record<string, unknown>>;
}

/** Runtime column: the def plus state-aware helpers bound to the table. */
export interface Column<TData> {
  id: string;
  def: ColumnDef<TData>;
  /** Current sort direction of this column, or `false` when unsorted. */
  getIsSorted(): SortDirection | false;
  /** Cycle asc → desc → unsorted. `additive` appends for multi-sort. */
  toggleSorting(desc?: boolean, additive?: boolean): void;
  getFilterValue(): unknown;
  setFilterValue(value: unknown): void;
  getCanSort(): boolean;
  getCanFilter(): boolean;
}

export interface Row<TData> {
  /** Stable id (from getRowId, defaults to stringified index). */
  id: string;
  /** Index within the original data array (or fetch page). -1 for group rows. */
  index: number;
  /** The user's original row object. `undefined` only for group rows. */
  original: TData;
  /** Nesting depth: 0 for top-level rows. */
  depth: number;
  subRows: readonly Row<TData>[];
  /** True when this row was synthesized by grouping. */
  isGroupRow: boolean;
  /** For group rows: the column id that produced the group. */
  groupColumnId?: string;
  /** For group rows: the shared value of the group. */
  groupValue?: unknown;
  /** Safe cell value access; returns undefined (never throws) for unknown columns. */
  getValue(columnId: string): unknown;
  getIsSelected(): boolean;
  toggleSelected(selected?: boolean): void;
  getIsExpanded(): boolean;
  toggleExpanded(expanded?: boolean): void;
  getCanExpand(): boolean;
}

export interface RowModel<TData> {
  /** Rows of the current page, as a tree (group rows contain subRows). */
  rows: readonly Row<TData>[];
  /**
   * Current page rows flattened in visual order, honoring `expanded`
   * (collapsed subtrees are omitted). This is what renderers iterate.
   */
  flatRows: readonly Row<TData>[];
}

export interface FetchParams {
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
}

export interface FetchResult<TData> {
  rows: readonly TData[];
  totalCount: number;
}

export type FetchData<TData> = (params: FetchParams) => Promise<FetchResult<TData>>;

export interface TableOptions<TData> {
  columns: readonly ColumnDef<TData>[];
  /** Client-side mode: the full data set. Mutually exclusive with `fetchData`. */
  data?: readonly TData[];
  /** Server-side mode: async page fetcher. Mutually exclusive with `data`. */
  fetchData?: FetchData<TData>;
  /** Stable row identity. Strongly recommended for selection/expansion. */
  getRowId?: (row: TData, index: number) => string;
  /** Controlled state slices. A slice present here is owned by the caller. */
  state?: Partial<TableState>;
  /** Initial values for uncontrolled slices. */
  initialState?: Partial<TableState>;
  onSortingChange?: (sorting: SortingState) => void;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  onGlobalFilterChange?: (globalFilter: string) => void;
  onPaginationChange?: (pagination: PaginationState) => void;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  onExpandedChange?: (expanded: ExpandedState) => void;
  onGroupingChange?: (grouping: GroupingState) => void;
  /** Called with any error thrown/rejected by `fetchData`. */
  onError?: (error: unknown) => void;
  /** Allow shift-click style multi-column sorting. Default: true. */
  enableMultiSort?: boolean;
  /** Reset to page 0 when sorting/filters change. Default: true. */
  autoResetPageIndex?: boolean;
  /** Label used to prefix dev-mode warnings. */
  debugLabel?: string;
}

export interface Table<TData> {
  /** Resolved state (controlled slices overlaid on internal state). */
  getState(): TableState;
  setState(updater: Updater<TableState>): void;
  /** Subscribe to any state/data change. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
  /** Monotonic version, bumped on every change — cheap snapshot for adapters. */
  getVersion(): number;
  getColumns(): readonly Column<TData>[];
  getColumn(columnId: string): Column<TData> | undefined;
  getRowModel(): RowModel<TData>;
  /** Rows after filter+sort+group but before pagination (client mode). */
  getPrePaginationRows(): readonly Row<TData>[];
  getTotalCount(): number;
  getPageCount(): number;

  setSorting(updater: Updater<SortingState>): void;
  setColumnFilters(updater: Updater<ColumnFiltersState>): void;
  setColumnFilter(columnId: string, value: unknown): void;
  setGlobalFilter(value: string): void;
  setPagination(updater: Updater<PaginationState>): void;
  setPageIndex(pageIndex: number): void;
  setPageSize(pageSize: number): void;
  nextPage(): void;
  previousPage(): void;
  getCanNextPage(): boolean;
  getCanPreviousPage(): boolean;

  setRowSelection(updater: Updater<RowSelectionState>): void;
  toggleRowSelected(rowId: string, selected?: boolean): void;
  /** Toggles all selectable rows currently passing filters (client) or on the page (server). */
  toggleAllRowsSelected(selected?: boolean): void;
  getSelectedRows(): readonly Row<TData>[];
  getIsAllRowsSelected(): boolean;
  getIsSomeRowsSelected(): boolean;

  setExpanded(updater: Updater<ExpandedState>): void;
  toggleRowExpanded(rowId: string, expanded?: boolean): void;

  setGrouping(updater: Updater<GroupingState>): void;

  /** True when `fetchData` was provided. */
  isServerMode: boolean;
  /** Server mode: a fetch is in flight. Always false in client mode. */
  getIsLoading(): boolean;
  /** Server mode: last fetch error, cleared on the next successful fetch. */
  getError(): unknown;
  /** Server mode: re-run the fetcher with current params. No-op in client mode. */
  refetch(): Promise<void>;
  /**
   * Adapters call this once on the client (e.g. in useEffect) to start
   * fetching. Keeps createTable() side-effect free and SSR-safe.
   */
  mount(): () => void;
  /** Adapters call this on re-render so new options/data/callbacks take effect. */
  setOptions(options: TableOptions<TData>): void;
}
