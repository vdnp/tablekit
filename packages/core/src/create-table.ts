import { filterRows } from "./features/filtering";
import { flattenVisibleRows, groupRows } from "./features/grouping";
import { sortRows } from "./features/sorting";
import type {
  Column,
  ColumnDef,
  Row,
  RowModel,
  SortDirection,
  Table,
  TableOptions,
  TableState,
  Updater,
} from "./types";
import { devWarn } from "./utils/dev";
import { resolveUpdater } from "./utils/updater";
import { readCellValue, resolveColumnId } from "./utils/value";

const DEFAULT_PAGE_SIZE = 10;

function defaultState(initial: Partial<TableState> | undefined): TableState {
  return {
    sorting: initial?.sorting ?? [],
    columnFilters: initial?.columnFilters ?? [],
    globalFilter: initial?.globalFilter ?? "",
    pagination: initial?.pagination ?? { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE },
    rowSelection: initial?.rowSelection ?? {},
    expanded: initial?.expanded ?? {},
    grouping: initial?.grouping ?? [],
  };
}

interface DerivedModel<TData> {
  /** Filtered + sorted leaf rows (client) or fetched page rows (server). */
  leafRows: readonly Row<TData>[];
  /** After grouping, before pagination. Top-level tree. */
  prePaginationRows: readonly Row<TData>[];
  rowModel: RowModel<TData>;
}

/**
 * Create a headless table instance. Pure and side-effect free: no timers,
 * no fetches, no globals — safe to call during SSR. Server-mode fetching
 * starts only after `mount()` is invoked by the adapter.
 */
export function createTable<TData>(initialOptions: TableOptions<TData>): Table<TData> {
  let options = initialOptions;
  let internalState = defaultState(initialOptions.initialState);
  let version = 0;
  const listeners = new Set<() => void>();

  // --- server mode ---------------------------------------------------------
  let mounted = false;
  let requestId = 0;
  let fetchQueued = false;
  let isLoading = false;
  let fetchError: unknown = undefined;
  let serverRows: readonly TData[] = [];
  let serverTotalCount = 0;

  // --- caches --------------------------------------------------------------
  let columnsCache: { source: readonly ColumnDef<TData>[]; columns: Column<TData>[] } | null =
    null;
  let modelCache: { version: number; model: DerivedModel<TData> } | null = null;
  let lastDataRef: readonly TData[] | undefined = initialOptions.data;

  validateOptions(initialOptions);

  function bump(): void {
    version += 1;
    modelCache = null;
  }

  function notify(): void {
    for (const listener of [...listeners]) listener();
  }

  function getState(): TableState {
    const controlled = options.state;
    if (!controlled) return internalState;
    return {
      sorting: controlled.sorting ?? internalState.sorting,
      columnFilters: controlled.columnFilters ?? internalState.columnFilters,
      globalFilter: controlled.globalFilter ?? internalState.globalFilter,
      pagination: controlled.pagination ?? internalState.pagination,
      rowSelection: controlled.rowSelection ?? internalState.rowSelection,
      expanded: controlled.expanded ?? internalState.expanded,
      grouping: controlled.grouping ?? internalState.grouping,
    };
  }

  type SliceKey = keyof TableState;

  function sliceCallback(key: SliceKey): ((value: never) => void) | undefined {
    switch (key) {
      case "sorting":
        return options.onSortingChange as ((value: never) => void) | undefined;
      case "columnFilters":
        return options.onColumnFiltersChange as ((value: never) => void) | undefined;
      case "globalFilter":
        return options.onGlobalFilterChange as ((value: never) => void) | undefined;
      case "pagination":
        return options.onPaginationChange as ((value: never) => void) | undefined;
      case "rowSelection":
        return options.onRowSelectionChange as ((value: never) => void) | undefined;
      case "expanded":
        return options.onExpandedChange as ((value: never) => void) | undefined;
      case "grouping":
        return options.onGroupingChange as ((value: never) => void) | undefined;
    }
  }

  const FETCH_RELEVANT: readonly SliceKey[] = [
    "sorting",
    "columnFilters",
    "globalFilter",
    "pagination",
  ];

  function setSlice<K extends SliceKey>(key: K, updater: Updater<TableState[K]>): void {
    const previous = getState()[key];
    const next = resolveUpdater(updater, previous);
    if (Object.is(next, previous)) return;

    const isControlled = options.state?.[key] !== undefined;
    if (!isControlled) {
      internalState = { ...internalState, [key]: next };
    }
    const callback = sliceCallback(key);
    if (callback) {
      try {
        callback(next as never);
      } catch (error) {
        devWarn(true, `on${key[0]?.toUpperCase()}${key.slice(1)}Change callback threw: ${String(error)}`);
      }
    }
    bump();
    if (table.isServerMode && FETCH_RELEVANT.includes(key)) scheduleFetch();
    notify();
  }

  /** Reset page index to 0 when a filter/sort change invalidates the page. */
  function maybeResetPageIndex(): void {
    if (options.autoResetPageIndex === false) return;
    const pagination = getState().pagination;
    if (pagination.pageIndex !== 0) {
      setSlice("pagination", { ...pagination, pageIndex: 0 });
    }
  }

  // --- columns ---------------------------------------------------------------

  function buildColumns(): Column<TData>[] {
    const seen = new Set<string>();
    return options.columns.map((def, index) => {
      const id = resolveColumnId(def, index);
      if (seen.has(id)) {
        devWarn(true, `Duplicate column id "${id}". Column ids must be unique.`);
      }
      seen.add(id);
      const column: Column<TData> = {
        id,
        def,
        getIsSorted(): SortDirection | false {
          const entry = getState().sorting.find((sort) => sort.id === id);
          return entry ? (entry.desc ? "desc" : "asc") : false;
        },
        getCanSort: () => def.sortable === true,
        getCanFilter: () =>
          def.filterable !== false && (def.accessorKey != null || def.accessorFn != null),
        toggleSorting(desc?: boolean, additive?: boolean) {
          if (!column.getCanSort()) {
            devWarn(true, `toggleSorting called on non-sortable column "${id}".`);
            return;
          }
          table.setSorting((sorting) => {
            const existing = sorting.find((sort) => sort.id === id);
            const multi = additive === true && options.enableMultiSort !== false;
            const rest = multi ? sorting.filter((sort) => sort.id !== id) : [];
            if (desc !== undefined) {
              return multi ? [...rest, { id, desc }] : [{ id, desc }];
            }
            // cycle: none -> asc -> desc -> none
            if (!existing) return [...rest, { id, desc: false }];
            if (!existing.desc) return [...rest, { id, desc: true }];
            return rest;
          });
          maybeResetPageIndex();
        },
        getFilterValue: () => getState().columnFilters.find((filter) => filter.id === id)?.value,
        setFilterValue: (value: unknown) => table.setColumnFilter(id, value),
      };
      return column;
    });
  }

  function getColumns(): Column<TData>[] {
    if (!columnsCache || columnsCache.source !== options.columns) {
      columnsCache = { source: options.columns, columns: buildColumns() };
    }
    return columnsCache.columns;
  }

  function getDefsById(): Map<string, ColumnDef<TData>> {
    const map = new Map<string, ColumnDef<TData>>();
    for (const column of getColumns()) map.set(column.id, column.def);
    return map;
  }

  // --- rows ------------------------------------------------------------------

  function makeLeafRow(original: TData, index: number): Row<TData> {
    const id = options.getRowId ? options.getRowId(original, index) : String(index);
    const valueCache = new Map<string, unknown>();
    const row: Row<TData> = {
      id,
      index,
      original,
      depth: 0,
      subRows: [],
      isGroupRow: false,
      getValue(columnId: string): unknown {
        if (valueCache.has(columnId)) return valueCache.get(columnId);
        const def = getDefsById().get(columnId);
        if (!def) {
          devWarn(true, `row.getValue("${columnId}"): unknown column id. Returning undefined.`);
          return undefined;
        }
        const value = readCellValue(def, original, index);
        valueCache.set(columnId, value);
        return value;
      },
      getIsSelected: () => getState().rowSelection[id] === true,
      toggleSelected: (selected?: boolean) => table.toggleRowSelected(id, selected),
      getIsExpanded: () => getState().expanded[id] === true,
      toggleExpanded: (expanded?: boolean) => table.toggleRowExpanded(id, expanded),
      getCanExpand: () => row.subRows.length > 0,
    };
    return row;
  }

  function makeGroupRow(args: {
    id: string;
    columnId: string;
    groupValue: unknown;
    depth: number;
    subRows: Row<TData>[];
  }): Row<TData> {
    const { id, columnId, groupValue, depth, subRows } = args;
    const row: Row<TData> = {
      id,
      index: -1,
      original: undefined as TData,
      depth,
      subRows,
      isGroupRow: true,
      groupColumnId: columnId,
      groupValue,
      getValue: (targetColumnId: string) =>
        targetColumnId === columnId ? groupValue : undefined,
      getIsSelected: () =>
        subRows.length > 0 && subRows.every((subRow) => subRow.getIsSelected()),
      toggleSelected(selected?: boolean) {
        const next = selected ?? !row.getIsSelected();
        table.setRowSelection((current) => {
          const draft: Record<string, boolean> = { ...current };
          const apply = (rows: readonly Row<TData>[]): void => {
            for (const child of rows) {
              if (child.isGroupRow) apply(child.subRows);
              else if (next) draft[child.id] = true;
              else delete draft[child.id];
            }
          };
          apply(subRows);
          return draft;
        });
      },
      // Group rows render expanded by default; store `false` to collapse.
      getIsExpanded: () => getState().expanded[id] !== false,
      toggleExpanded(expanded?: boolean) {
        const next = expanded ?? !row.getIsExpanded();
        table.setExpanded((current) => ({ ...current, [id]: next }));
      },
      getCanExpand: () => subRows.length > 0,
    };
    return row;
  }

  function buildLeafRows(source: readonly TData[]): Row<TData>[] {
    const seenIds = new Set<string>();
    return source.map((original, index) => {
      const row = makeLeafRow(original, index);
      if (seenIds.has(row.id)) {
        devWarn(
          true,
          `Duplicate row id "${row.id}" from getRowId. Selection/expansion will misbehave.`,
        );
      }
      seenIds.add(row.id);
      return row;
    });
  }

  function computeModel(): DerivedModel<TData> {
    if (modelCache && modelCache.version === version) return modelCache.model;

    const state = getState();
    const defsById = getDefsById();
    let leafRows: readonly Row<TData>[];
    let prePaginationRows: readonly Row<TData>[];
    let pageRows: readonly Row<TData>[];

    if (table.isServerMode) {
      // The server already applied filter/sort/paginate.
      leafRows = buildLeafRows(serverRows);
      prePaginationRows = leafRows;
      pageRows = leafRows;
    } else {
      const source = options.data ?? [];
      const filtered = filterRows(
        buildLeafRows(source),
        state.columnFilters,
        state.globalFilter,
        defsById,
      );
      leafRows = sortRows(filtered, state.sorting, defsById);
      prePaginationRows =
        state.grouping.length > 0
          ? groupRows(leafRows, state.grouping, makeGroupRow)
          : leafRows;
      const { pageIndex, pageSize } = state.pagination;
      pageRows =
        pageSize > 0
          ? prePaginationRows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
          : prePaginationRows;
    }

    const model: DerivedModel<TData> = {
      leafRows,
      prePaginationRows,
      rowModel: { rows: pageRows, flatRows: flattenVisibleRows(pageRows) },
    };
    modelCache = { version, model };
    return model;
  }

  /** Leaf rows eligible for select-all: filtered set (client) or current page (server). */
  function selectableRows(): readonly Row<TData>[] {
    return computeModel().leafRows;
  }

  // --- fetching ----------------------------------------------------------------

  function scheduleFetch(): void {
    if (!mounted || fetchQueued) return;
    fetchQueued = true;
    // Microtask coalescing without queueMicrotask (keeps lib requirements at ES2020).
    void Promise.resolve().then(() => {
      fetchQueued = false;
      if (mounted) void runFetch();
    });
  }

  async function runFetch(): Promise<void> {
    const fetchData = options.fetchData;
    if (!fetchData) return;
    const id = ++requestId;
    isLoading = true;
    bump();
    notify();
    try {
      const state = getState();
      const result = await fetchData({
        pageIndex: state.pagination.pageIndex,
        pageSize: state.pagination.pageSize,
        sorting: state.sorting,
        columnFilters: state.columnFilters,
        globalFilter: state.globalFilter,
      });
      if (id !== requestId) return; // stale response — a newer request superseded it
      if (!result || !Array.isArray(result.rows) || typeof result.totalCount !== "number") {
        devWarn(
          true,
          `fetchData must resolve to { rows: TData[], totalCount: number }; got ${JSON.stringify(result)?.slice(0, 120)}. Treating as empty.`,
        );
        serverRows = [];
        serverTotalCount = 0;
      } else {
        serverRows = result.rows;
        serverTotalCount = result.totalCount;
      }
      fetchError = undefined;
    } catch (error) {
      if (id !== requestId) return;
      fetchError = error;
      try {
        options.onError?.(error);
      } catch (callbackError) {
        devWarn(true, `onError callback threw: ${String(callbackError)}`);
      }
    } finally {
      if (id === requestId) {
        isLoading = false;
        bump();
        notify();
      }
    }
  }

  // --- table -----------------------------------------------------------------

  const table: Table<TData> = {
    isServerMode: typeof initialOptions.fetchData === "function",

    getState,
    setState(updater: Updater<TableState>) {
      const next = resolveUpdater(updater, getState());
      const previous = getState();
      let changed = false;
      for (const key of Object.keys(next) as SliceKey[]) {
        if (!Object.is(next[key], previous[key])) {
          setSlice(key, next[key] as never);
          changed = true;
        }
      }
      if (!changed) return;
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getVersion: () => version,

    getColumns,
    getColumn: (columnId: string) => getColumns().find((column) => column.id === columnId),
    getRowModel: () => computeModel().rowModel,
    getPrePaginationRows: () => computeModel().prePaginationRows,
    getTotalCount: () =>
      table.isServerMode ? serverTotalCount : computeModel().leafRows.length,
    getPageCount() {
      const { pageSize } = getState().pagination;
      if (pageSize <= 0) return 1;
      const count = table.isServerMode
        ? serverTotalCount
        : computeModel().prePaginationRows.length;
      return Math.max(1, Math.ceil(count / pageSize));
    },

    setSorting(updater) {
      setSlice("sorting", updater);
      maybeResetPageIndex();
    },
    setColumnFilters(updater) {
      setSlice("columnFilters", updater);
      maybeResetPageIndex();
    },
    setColumnFilter(columnId, value) {
      table.setColumnFilters((filters) => {
        const rest = filters.filter((filter) => filter.id !== columnId);
        const isEmpty =
          value == null || value === "" || (Array.isArray(value) && value.length === 0);
        return isEmpty ? rest : [...rest, { id: columnId, value }];
      });
    },
    setGlobalFilter(value) {
      setSlice("globalFilter", value);
      maybeResetPageIndex();
    },

    setPagination: (updater) => setSlice("pagination", updater),
    setPageIndex(pageIndex) {
      const clamped = Math.min(Math.max(0, pageIndex), table.getPageCount() - 1);
      if (clamped === getState().pagination.pageIndex) return;
      setSlice("pagination", (pagination) => ({ ...pagination, pageIndex: clamped }));
    },
    setPageSize(pageSize) {
      if (pageSize <= 0) {
        devWarn(true, `setPageSize(${pageSize}) ignored; pageSize must be > 0.`);
        return;
      }
      setSlice("pagination", (pagination) => {
        const firstVisibleRow = pagination.pageIndex * pagination.pageSize;
        return { pageIndex: Math.floor(firstVisibleRow / pageSize), pageSize };
      });
    },
    nextPage: () => table.setPageIndex(getState().pagination.pageIndex + 1),
    previousPage: () => table.setPageIndex(getState().pagination.pageIndex - 1),
    getCanNextPage: () => getState().pagination.pageIndex < table.getPageCount() - 1,
    getCanPreviousPage: () => getState().pagination.pageIndex > 0,

    setRowSelection: (updater) => setSlice("rowSelection", updater),
    toggleRowSelected(rowId, selected) {
      setSlice("rowSelection", (current) => {
        const next = selected ?? current[rowId] !== true;
        const draft: Record<string, boolean> = { ...current };
        if (next) draft[rowId] = true;
        else delete draft[rowId];
        return draft;
      });
    },
    toggleAllRowsSelected(selected) {
      const rows = selectableRows();
      const next = selected ?? !table.getIsAllRowsSelected();
      setSlice("rowSelection", (current) => {
        const draft: Record<string, boolean> = { ...current };
        for (const row of rows) {
          if (next) draft[row.id] = true;
          else delete draft[row.id];
        }
        return draft;
      });
    },
    getSelectedRows() {
      const selection = getState().rowSelection;
      return computeModel().leafRows.filter((row) => selection[row.id] === true);
    },
    getIsAllRowsSelected() {
      const rows = selectableRows();
      if (rows.length === 0) return false;
      const selection = getState().rowSelection;
      return rows.every((row) => selection[row.id] === true);
    },
    getIsSomeRowsSelected() {
      const selection = getState().rowSelection;
      return (
        !table.getIsAllRowsSelected() &&
        selectableRows().some((row) => selection[row.id] === true)
      );
    },

    setExpanded: (updater) => setSlice("expanded", updater),
    toggleRowExpanded(rowId, expanded) {
      setSlice("expanded", (current) => {
        const next = expanded ?? current[rowId] !== true;
        return { ...current, [rowId]: next };
      });
    },

    setGrouping: (updater) => setSlice("grouping", updater),

    getIsLoading: () => isLoading,
    getError: () => fetchError,
    async refetch() {
      if (!table.isServerMode) return;
      await runFetch();
    },
    mount() {
      mounted = true;
      if (table.isServerMode) void runFetch();
      return () => {
        mounted = false;
        requestId += 1; // invalidate in-flight responses
      };
    },
    setOptions(nextOptions: TableOptions<TData>) {
      const previous = options;
      options = nextOptions;
      validateOptions(nextOptions);
      if (
        previous.columns !== nextOptions.columns ||
        lastDataRef !== nextOptions.data ||
        previous.state !== nextOptions.state
      ) {
        lastDataRef = nextOptions.data;
        bump();
      }
    },
  };

  function validateOptions(candidate: TableOptions<TData>): void {
    devWarn(
      candidate.data != null && candidate.fetchData != null,
      `Both "data" and "fetchData" were provided. "fetchData" wins; "data" is ignored.`,
    );
    devWarn(
      candidate.data == null && candidate.fetchData == null,
      `Neither "data" nor "fetchData" was provided. The table will render empty.`,
    );
    devWarn(
      !Array.isArray(candidate.columns),
      `"columns" must be an array of column definitions.`,
    );
  }

  return table;
}
