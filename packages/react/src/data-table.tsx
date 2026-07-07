"use client";

import { createTable, devWarn } from "@vdnp/tablekit-core";
import type { Column, Row, Table, TableOptions } from "@vdnp/tablekit-core";
import { themeToCssVariables } from "@vdnp/tablekit-theme";
import type { ThemeTokens } from "@vdnp/tablekit-theme";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { formatCellValue, renderSlot } from "./render-slot";

export interface BulkAction {
  id: string;
  label: string;
}

export const defaultLabels = {
  search: "Search",
  edit: "Edit",
  delete: "Delete",
  empty: "No results.",
  error: "Something went wrong while loading data.",
  retry: "Retry",
  loading: "Loading…",
  selectAll: "Select all rows",
  selectRow: "Select row",
  expandRow: "Toggle row details",
  previousPage: "Previous page",
  nextPage: "Next page",
  rowsPerPage: "Rows per page",
  pageInfo: (page: number, pageCount: number, total: number) =>
    `Page ${page} of ${pageCount} · ${total} rows`,
  selectedCount: (count: number) => `${count} selected`,
} as const;

export type DataTableLabels = typeof defaultLabels;

export interface DataTableProps<TData> extends Omit<TableOptions<TData>, "columns"> {
  /** Column definitions. Optional only when a prebuilt `table` is passed. */
  columns?: TableOptions<TData>["columns"];
  /** Headless escape hatch: bring your own instance from useDataTable(). */
  table?: Table<TData>;
  onRowClick?: (row: Row<TData>) => void;
  /** When provided, an actions column with an Edit button is appended. */
  onEdit?: (row: Row<TData>) => void;
  /** When provided, an actions column with a Delete button is appended. */
  onDelete?: (row: Row<TData>) => void;
  /** Buttons shown in the bulk bar while rows are selected. */
  bulkActions?: readonly BulkAction[];
  onBulkAction?: (actionId: string, rows: readonly Row<TData>[]) => void;
  /** Render a leading checkbox column. */
  enableSelection?: boolean;
  /** Render the global search input above the table. Default: false. */
  showGlobalFilter?: boolean;
  /** Render the pagination footer. Default: true. */
  showPagination?: boolean;
  pageSizeOptions?: readonly number[];
  renderLoading?: () => ReactNode;
  renderEmpty?: () => ReactNode;
  renderError?: (error: unknown, retry: () => Promise<void>) => ReactNode;
  /** When provided, rows get an expander and this renders the detail panel. */
  renderExpandedRow?: (row: Row<TData>) => ReactNode;
  /** Token object applied as CSS variables on the root element. */
  theme?: ThemeTokens;
  /** Without a `theme`, picks the built-in light or dark variable set. */
  colorScheme?: "light" | "dark";
  className?: string;
  /** Accessible table caption (visually hidden). */
  caption?: string;
  labels?: Partial<DataTableLabels>;
}

const CORE_OPTION_KEYS = [
  "data",
  "fetchData",
  "getRowId",
  "state",
  "initialState",
  "onSortingChange",
  "onColumnFiltersChange",
  "onGlobalFilterChange",
  "onPaginationChange",
  "onRowSelectionChange",
  "onExpandedChange",
  "onGroupingChange",
  "onError",
  "enableMultiSort",
  "autoResetPageIndex",
  "debugLabel",
] as const;

function pickTableOptions<TData>(props: DataTableProps<TData>): TableOptions<TData> {
  const options = { columns: props.columns ?? [] } as { columns: TableOptions<TData>["columns"] } & Record<string, unknown>;
  for (const key of CORE_OPTION_KEYS) {
    if (props[key] !== undefined) options[key] = props[key];
  }
  return options as TableOptions<TData>;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

interface PinOffset {
  side: "left" | "right";
  offset: number;
}

function computePinOffsets<TData>(
  columns: readonly Column<TData>[],
  sizing: Readonly<Record<string, number>>,
): Map<string, PinOffset> {
  const offsets = new Map<string, PinOffset>();
  let left = 0;
  for (const column of columns) {
    if (column.def.pinned !== "left") continue;
    offsets.set(column.id, { side: "left", offset: left });
    left += sizing[column.id] ?? column.def.width ?? 0;
  }
  let right = 0;
  for (const column of [...columns].reverse()) {
    if (column.def.pinned !== "right") continue;
    offsets.set(column.id, { side: "right", offset: right });
    right += sizing[column.id] ?? column.def.width ?? 0;
  }
  return offsets;
}

function countLeafRows<TData>(row: Row<TData>): number {
  if (!row.isGroupRow) return 1;
  let count = 0;
  for (const subRow of row.subRows) count += countLeafRows(subRow);
  return count;
}

/**
 * Batteries-included table renderer on top of @vdnp/tablekit-core.
 * For full UI control, use useDataTable() and build your own markup.
 */
export function DataTable<TData>(props: DataTableProps<TData>): ReactNode {
  const {
    table: externalTable,
    onRowClick,
    onEdit,
    onDelete,
    bulkActions,
    onBulkAction,
    enableSelection,
    showGlobalFilter,
    showPagination,
    pageSizeOptions,
    renderLoading,
    renderEmpty,
    renderError,
    renderExpandedRow,
    theme,
    colorScheme,
    className,
    caption,
  } = props;

  const ownsTable = externalTable == null;
  devWarn(
    ownsTable && props.columns == null,
    `<DataTable /> needs either "columns" (+ data/fetchData) or a prebuilt "table".`,
  );

  const [ownedTable] = useState<Table<TData>>(
    () => externalTable ?? createTable<TData>(pickTableOptions(props)),
  );
  const table = externalTable ?? ownedTable;
  if (ownsTable) table.setOptions(pickTableOptions(props));

  const subscribe = useCallback(
    (onStoreChange: () => void) => table.subscribe(onStoreChange),
    [table],
  );
  const getSnapshot = useCallback(() => table.getVersion(), [table]);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Only mount instances we own; external ones are mounted by useDataTable.
  useEffect(() => (ownsTable ? table.mount() : undefined), [ownsTable, table]);

  const labels: DataTableLabels = useMemo(
    () => ({ ...defaultLabels, ...props.labels }),
    [props.labels],
  );

  const [columnSizing, setColumnSizing] = useState<Readonly<Record<string, number>>>({});

  const state = table.getState();
  const model = table.getRowModel();
  const columns = table.getColumns();
  const isLoading = table.getIsLoading();
  const error = table.getError();
  const selectedRows = table.getSelectedRows();

  const hasSelection = enableSelection === true;
  const hasActions = onEdit != null || onDelete != null;
  const hasExpander = renderExpandedRow != null;
  const totalColumnCount =
    columns.length + (hasSelection ? 1 : 0) + (hasExpander ? 1 : 0) + (hasActions ? 1 : 0);

  const pinOffsets = useMemo(
    () => computePinOffsets(columns, columnSizing),
    [columns, columnSizing],
  );

  const themeStyle = useMemo<CSSProperties | undefined>(
    () => (theme ? (themeToCssVariables(theme) as CSSProperties) : undefined),
    [theme],
  );

  const columnStyle = (column: Column<TData>): CSSProperties => {
    const style: CSSProperties = {
      width: columnSizing[column.id] ?? column.def.width,
      minWidth: column.def.minWidth,
      maxWidth: column.def.maxWidth,
      textAlign: column.def.align,
    };
    const pin = pinOffsets.get(column.id);
    if (pin) {
      style.position = "sticky";
      style[pin.side] = pin.offset;
      style.zIndex = 1;
    }
    return style;
  };

  const startResize = (event: ReactPointerEvent<HTMLElement>, column: Column<TData>): void => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const headerCell = event.currentTarget.closest("th");
    const startWidth =
      columnSizing[column.id] ??
      column.def.width ??
      headerCell?.getBoundingClientRect().width ??
      120;
    const minWidth = column.def.minWidth ?? 48;
    const maxWidth = column.def.maxWidth ?? Number.MAX_SAFE_INTEGER;
    const handleMove = (moveEvent: PointerEvent): void => {
      const next = clamp(startWidth + (moveEvent.clientX - startX), minWidth, maxWidth);
      setColumnSizing((sizing) => ({ ...sizing, [column.id]: next }));
    };
    const handleUp = (): void => {
      window.removeEventListener("pointermove", handleMove);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
  };

  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, row: Row<TData>): void => {
    if (event.target !== event.currentTarget) return;
    if ((event.key === "Enter" || event.key === " ") && onRowClick) {
      event.preventDefault();
      onRowClick(row);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const sibling =
        event.key === "ArrowDown"
          ? event.currentTarget.nextElementSibling
          : event.currentTarget.previousElementSibling;
      if (sibling instanceof HTMLElement && sibling.tabIndex >= 0) {
        event.preventDefault();
        sibling.focus();
      }
    }
  };

  const renderCellContent = (row: Row<TData>, column: Column<TData>): ReactNode => {
    const value = row.getValue(column.id);
    if (column.def.cell) {
      return renderSlot(column.def.cell({ row, column, table, value }));
    }
    return formatCellValue(value);
  };

  const renderHeaderContent = (column: Column<TData>): ReactNode => {
    const header = column.def.header;
    if (typeof header === "function") return renderSlot(header());
    return header ?? column.id;
  };

  const renderGroupRow = (row: Row<TData>): ReactNode => (
    <tr key={row.id} className="tk-group-row">
      <td colSpan={totalColumnCount} style={{ paddingLeft: 12 + row.depth * 20 }}>
        <button
          type="button"
          className="tk-expander"
          aria-expanded={row.getIsExpanded()}
          aria-label={labels.expandRow}
          onClick={() => row.toggleExpanded()}
        >
          {row.getIsExpanded() ? "▾" : "▸"}
        </button>
        {hasSelection ? (
          <input
            type="checkbox"
            className="tk-checkbox"
            checked={row.getIsSelected()}
            onChange={() => row.toggleSelected()}
            aria-label={labels.selectAll}
          />
        ) : null}
        <span className="tk-group-label">
          {formatCellValue(row.groupValue) || "—"}
          <span className="tk-group-count"> ({countLeafRows(row)})</span>
        </span>
      </td>
    </tr>
  );

  const renderLeafRow = (row: Row<TData>): ReactNode => (
    <Fragment key={row.id}>
      <tr
        className={`tk-row${row.getIsSelected() ? " tk-row-selected" : ""}`}
        style={row.depth > 0 ? { ["--tk-row-depth" as string]: row.depth } : undefined}
        tabIndex={onRowClick ? 0 : undefined}
        aria-selected={hasSelection ? row.getIsSelected() : undefined}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
        onKeyDown={onRowClick ? (event) => handleRowKeyDown(event, row) : undefined}
      >
        {hasSelection ? (
          <td className="tk-checkbox-cell">
            <input
              type="checkbox"
              className="tk-checkbox"
              checked={row.getIsSelected()}
              onClick={(event) => event.stopPropagation()}
              onChange={() => row.toggleSelected()}
              aria-label={labels.selectRow}
            />
          </td>
        ) : null}
        {hasExpander ? (
          <td className="tk-expander-cell">
            <button
              type="button"
              className="tk-expander"
              aria-expanded={row.getIsExpanded()}
              aria-label={labels.expandRow}
              onClick={(event) => {
                event.stopPropagation();
                row.toggleExpanded();
              }}
            >
              {row.getIsExpanded() ? "▾" : "▸"}
            </button>
          </td>
        ) : null}
        {columns.map((column) => (
          <td key={column.id} className="tk-cell" style={columnStyle(column)}>
            {renderCellContent(row, column)}
          </td>
        ))}
        {hasActions ? (
          <td className="tk-actions-cell">
            {onEdit ? (
              <button
                type="button"
                className="tk-action-button"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(row);
                }}
              >
                {labels.edit}
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                className="tk-action-button tk-action-danger"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(row);
                }}
              >
                {labels.delete}
              </button>
            ) : null}
          </td>
        ) : null}
      </tr>
      {hasExpander && row.getIsExpanded() ? (
        <tr className="tk-detail-row">
          <td colSpan={totalColumnCount}>{renderExpandedRow(row)}</td>
        </tr>
      ) : null}
    </Fragment>
  );

  const renderBody = (): ReactNode => {
    if (error != null && !isLoading) {
      return (
        <tr className="tk-state-row">
          <td colSpan={totalColumnCount}>
            {renderError ? (
              renderError(error, () => table.refetch())
            ) : (
              <div role="alert" className="tk-error">
                <p>{labels.error}</p>
                <button type="button" className="tk-action-button" onClick={() => void table.refetch()}>
                  {labels.retry}
                </button>
              </div>
            )}
          </td>
        </tr>
      );
    }
    if (isLoading && model.flatRows.length === 0) {
      if (renderLoading) {
        return (
          <tr className="tk-state-row">
            <td colSpan={totalColumnCount}>{renderLoading()}</td>
          </tr>
        );
      }
      const skeletonCount = clamp(state.pagination.pageSize, 3, 8);
      return Array.from({ length: skeletonCount }, (_, index) => (
        <tr key={index} className="tk-skeleton-row" aria-hidden="true">
          <td colSpan={totalColumnCount}>
            <div className="tk-skeleton" />
          </td>
        </tr>
      ));
    }
    if (model.flatRows.length === 0) {
      return (
        <tr className="tk-state-row">
          <td colSpan={totalColumnCount}>
            {renderEmpty ? renderEmpty() : <div className="tk-empty">{labels.empty}</div>}
          </td>
        </tr>
      );
    }
    return model.flatRows.map((row) => (row.isGroupRow ? renderGroupRow(row) : renderLeafRow(row)));
  };

  const showBulkBar =
    selectedRows.length > 0 && ((bulkActions?.length ?? 0) > 0 || onBulkAction != null);

  return (
    <div
      className={className ? `tk-root ${className}` : "tk-root"}
      style={themeStyle}
      data-tk-color-scheme={theme ? undefined : colorScheme}
    >
      {showGlobalFilter || showBulkBar ? (
        <div className="tk-toolbar">
          {showGlobalFilter ? (
            <input
              type="search"
              className="tk-search"
              placeholder={labels.search}
              aria-label={labels.search}
              value={state.globalFilter}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
            />
          ) : null}
          {showBulkBar ? (
            <div className="tk-bulk-bar" role="toolbar" aria-label={labels.selectedCount(selectedRows.length)}>
              <span className="tk-bulk-count">{labels.selectedCount(selectedRows.length)}</span>
              {(bulkActions ?? []).map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="tk-action-button"
                  onClick={() => onBulkAction?.(action.id, selectedRows)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="tk-table-wrap">
        <table className="tk-table" aria-busy={isLoading || undefined}>
          {caption ? <caption className="tk-visually-hidden">{caption}</caption> : null}
          <thead className="tk-head">
            <tr>
              {hasSelection ? (
                <th scope="col" className="tk-checkbox-cell">
                  <input
                    type="checkbox"
                    className="tk-checkbox"
                    checked={table.getIsAllRowsSelected()}
                    ref={(element) => {
                      if (element) element.indeterminate = table.getIsSomeRowsSelected();
                    }}
                    onChange={() => table.toggleAllRowsSelected()}
                    aria-label={labels.selectAll}
                  />
                </th>
              ) : null}
              {hasExpander ? <th scope="col" className="tk-expander-cell" /> : null}
              {columns.map((column) => {
                const sorted = column.getIsSorted();
                return (
                  <th
                    key={column.id}
                    scope="col"
                    className="tk-header-cell"
                    style={columnStyle(column)}
                    aria-sort={
                      sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined
                    }
                  >
                    {column.getCanSort() ? (
                      <button
                        type="button"
                        className="tk-sort-button"
                        onClick={(event) => column.toggleSorting(undefined, event.shiftKey)}
                      >
                        <span>{renderHeaderContent(column)}</span>
                        <span className="tk-sort-icon" aria-hidden="true">
                          {sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : "↕"}
                        </span>
                      </button>
                    ) : (
                      renderHeaderContent(column)
                    )}
                    {column.def.resizable ? (
                      <span
                        className="tk-resize-handle"
                        role="separator"
                        aria-orientation="vertical"
                        onPointerDown={(event) => startResize(event, column)}
                      />
                    ) : null}
                  </th>
                );
              })}
              {hasActions ? <th scope="col" className="tk-actions-cell" /> : null}
            </tr>
          </thead>
          <tbody className="tk-body">{renderBody()}</tbody>
        </table>
      </div>

      {showPagination !== false ? (
        <div className="tk-footer">
          <label className="tk-page-size">
            {labels.rowsPerPage}
            <select
              className="tk-page-size-select"
              value={state.pagination.pageSize}
              onChange={(event) => table.setPageSize(Number(event.target.value))}
            >
              {(pageSizeOptions ?? [10, 20, 50]).map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <span className="tk-page-info" aria-live="polite">
            {labels.pageInfo(
              state.pagination.pageIndex + 1,
              table.getPageCount(),
              table.getTotalCount(),
            )}
          </span>
          <div className="tk-pager">
            <button
              type="button"
              className="tk-action-button"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              aria-label={labels.previousPage}
            >
              ‹
            </button>
            <button
              type="button"
              className="tk-action-button"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              aria-label={labels.nextPage}
            >
              ›
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
