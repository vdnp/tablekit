import { createTable, devWarn } from "@tablekit/core";
import type { Column, Row, Table, TableOptions } from "@tablekit/core";
import { lightTheme, darkTheme } from "@tablekit/theme";
import type { ThemeTokens } from "@tablekit/theme";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { ComponentType, ReactElement, ReactNode } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { cellLayout, formatCellText } from "./helpers";

/**
 * Structural subset of FlatList/FlashList props we rely on — lets callers
 * inject @shopify/flash-list without this package depending on it.
 */
export interface VirtualListProps<TItem> {
  data: readonly TItem[];
  renderItem: (info: { item: TItem; index: number }) => ReactElement | null;
  keyExtractor: (item: TItem, index: number) => string;
  extraData?: unknown;
  ListEmptyComponent?: ReactElement | null;
}

export type VirtualListComponent<TItem> = ComponentType<VirtualListProps<TItem>>;

export const defaultLabels = {
  search: "Search",
  empty: "No results.",
  error: "Something went wrong while loading data.",
  retry: "Retry",
  previousPage: "Previous page",
  nextPage: "Next page",
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
  onRowPress?: (row: Row<TData>) => void;
  /** Long-press handler — the natural RN idiom for row context actions. */
  onRowLongPress?: (row: Row<TData>) => void;
  bulkActions?: readonly { id: string; label: string }[];
  onBulkAction?: (actionId: string, rows: readonly Row<TData>[]) => void;
  enableSelection?: boolean;
  showGlobalFilter?: boolean;
  showPagination?: boolean;
  renderLoading?: () => ReactNode;
  renderEmpty?: () => ReactNode;
  renderError?: (error: unknown, retry: () => Promise<void>) => ReactNode;
  renderExpandedRow?: (row: Row<TData>) => ReactNode;
  theme?: ThemeTokens;
  colorScheme?: "light" | "dark";
  labels?: Partial<DataTableLabels>;
  /**
   * Virtualized list implementation. Defaults to FlatList; pass FlashList
   * from @shopify/flash-list for large data sets:
   *   ListComponent={FlashList as VirtualListComponent<Row<TData>>}
   */
  ListComponent?: VirtualListComponent<Row<TData>>;
  /** Minimum total width before the table scrolls horizontally. */
  minTableWidth?: number;
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
  const options = { columns: props.columns ?? [] } as {
    columns: TableOptions<TData>["columns"];
  } & Record<string, unknown>;
  for (const key of CORE_OPTION_KEYS) {
    if (props[key] !== undefined) options[key] = props[key];
  }
  return options as TableOptions<TData>;
}

/**
 * Virtualized table for React Native, driven by @tablekit/core. Rows render
 * through FlatList by default; inject FlashList via `ListComponent` for
 * large lists.
 */
export function DataTable<TData>(props: DataTableProps<TData>): ReactNode {
  const {
    table: externalTable,
    onRowPress,
    onRowLongPress,
    bulkActions,
    onBulkAction,
    enableSelection,
    showGlobalFilter,
    showPagination,
    renderLoading,
    renderEmpty,
    renderError,
    renderExpandedRow,
    theme,
    colorScheme,
    ListComponent,
    minTableWidth,
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

  useEffect(() => (ownsTable ? table.mount() : undefined), [ownsTable, table]);

  const tokens = theme ?? (colorScheme === "dark" ? darkTheme : lightTheme);
  const labels: DataTableLabels = useMemo(
    () => ({ ...defaultLabels, ...props.labels }),
    [props.labels],
  );

  const state = table.getState();
  const model = table.getRowModel();
  const columns = table.getColumns();
  const isLoading = table.getIsLoading();
  const error = table.getError();
  const selectedRows = table.getSelectedRows();
  const hasSelection = enableSelection === true;

  const colors = tokens.colors;
  const cellPad = {
    paddingHorizontal: tokens.spacing.cellX,
    paddingVertical: tokens.spacing.cellY,
  } as const;
  const textStyle = {
    color: colors.text,
    fontSize: tokens.typography.fontSize,
  } as const;
  const mutedText = { color: colors.textMuted, fontSize: tokens.typography.fontSize } as const;

  const renderCheckbox = (checked: boolean, onToggle: () => void): ReactElement => (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      hitSlop={8}
      style={{
        width: 18,
        height: 18,
        borderRadius: tokens.radius.control,
        borderWidth: 1.5,
        borderColor: checked ? colors.accent : colors.border,
        backgroundColor: checked ? colors.accent : "transparent",
        alignItems: "center",
        justifyContent: "center",
        marginRight: tokens.spacing.inlineGap,
      }}
    >
      {checked ? (
        <Text style={{ color: colors.accentForeground, fontSize: 12, lineHeight: 14 }}>✓</Text>
      ) : null}
    </Pressable>
  );

  const renderHeader = (): ReactElement => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surfaceMuted,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {hasSelection ? (
        <View style={{ ...cellPad, width: 44 }}>
          {renderCheckbox(table.getIsAllRowsSelected(), () => table.toggleAllRowsSelected())}
        </View>
      ) : null}
      {columns.map((column) => {
        const sorted = column.getIsSorted();
        const layout = cellLayout(column);
        const headerText =
          typeof column.def.header === "string" ? column.def.header : column.id;
        return (
          <Pressable
            key={column.id}
            disabled={!column.getCanSort()}
            onPress={() => column.toggleSorting()}
            accessibilityRole={column.getCanSort() ? "button" : undefined}
            accessibilityLabel={headerText}
            accessibilityState={column.getCanSort() ? { selected: sorted !== false } : undefined}
            style={{ ...cellPad, ...layout, flexDirection: "row", gap: tokens.spacing.inlineGap }}
          >
            <Text
              numberOfLines={1}
              style={{
                color: colors.textMuted,
                fontSize: tokens.typography.headerFontSize,
                fontWeight: "600",
              }}
            >
              {headerText}
            </Text>
            {column.getCanSort() ? (
              <Text style={{ color: sorted ? colors.accent : colors.textMuted, fontSize: 11 }}>
                {sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : "↕"}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );

  const renderCell = (row: Row<TData>, column: Column<TData>): ReactNode => {
    const value = row.getValue(column.id);
    if (column.def.cell) {
      const rendered = column.def.cell({ row, column, table, value });
      // Adapters narrow core's unknown render slot; strings still need <Text>.
      if (typeof rendered === "string" || typeof rendered === "number") {
        return <Text style={textStyle}>{rendered}</Text>;
      }
      return (rendered as ReactNode) ?? null;
    }
    return (
      <Text numberOfLines={1} style={textStyle}>
        {formatCellText(value)}
      </Text>
    );
  };

  const renderRow = ({ item: row }: { item: Row<TData> }): ReactElement | null => {
    if (row.isGroupRow) {
      return (
        <Pressable
          onPress={() => row.toggleExpanded()}
          accessibilityRole="button"
          accessibilityState={{ expanded: row.getIsExpanded() }}
          style={{
            ...cellPad,
            paddingLeft: tokens.spacing.cellX + row.depth * 18,
            flexDirection: "row",
            alignItems: "center",
            gap: tokens.spacing.inlineGap,
            backgroundColor: colors.surfaceMuted,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={mutedText}>{row.getIsExpanded() ? "▾" : "▸"}</Text>
          <Text style={{ ...textStyle, fontWeight: "600" }}>
            {formatCellText(row.groupValue) || "—"}
          </Text>
          <Text style={mutedText}>({row.subRows.length})</Text>
        </Pressable>
      );
    }

    const selected = row.getIsSelected();
    return (
      <View>
        <Pressable
          onPress={onRowPress ? () => onRowPress(row) : undefined}
          onLongPress={onRowLongPress ? () => onRowLongPress(row) : undefined}
          accessibilityState={hasSelection ? { selected } : undefined}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: selected
              ? colors.surfaceSelected
              : pressed
                ? colors.surfaceHover
                : colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          })}
        >
          {hasSelection ? (
            <View style={{ ...cellPad, width: 44 }}>
              {renderCheckbox(selected, () => row.toggleSelected())}
            </View>
          ) : null}
          {columns.map((column) => (
            <View key={column.id} style={{ ...cellPad, ...cellLayout(column) }}>
              {renderCell(row, column)}
            </View>
          ))}
        </Pressable>
        {renderExpandedRow && row.getIsExpanded() ? (
          <View style={{ ...cellPad, backgroundColor: colors.surfaceMuted }}>
            {renderExpandedRow(row)}
          </View>
        ) : null}
      </View>
    );
  };

  const renderBody = (): ReactNode => {
    if (error != null && !isLoading) {
      if (renderError) return renderError(error, () => table.refetch());
      return (
        <View
          accessibilityRole="alert"
          style={{
            padding: 24,
            alignItems: "center",
            gap: 10,
            backgroundColor: colors.dangerSurface,
          }}
        >
          <Text style={{ color: colors.danger, fontSize: tokens.typography.fontSize }}>
            {labels.error}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void table.refetch()}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: tokens.radius.control,
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: colors.surface,
            }}
          >
            <Text style={textStyle}>{labels.retry}</Text>
          </Pressable>
        </View>
      );
    }
    if (isLoading && model.flatRows.length === 0) {
      if (renderLoading) return renderLoading();
      return (
        <View style={{ padding: 32, alignItems: "center" }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      );
    }

    const List: VirtualListComponent<Row<TData>> =
      ListComponent ?? (FlatList as unknown as VirtualListComponent<Row<TData>>);
    return (
      <List
        data={model.flatRows}
        renderItem={renderRow}
        keyExtractor={(row) => row.id}
        extraData={table.getVersion()}
        ListEmptyComponent={
          <View style={{ padding: 32, alignItems: "center" }}>
            {renderEmpty ? (renderEmpty() as ReactElement) : <Text style={mutedText}>{labels.empty}</Text>}
          </View>
        }
      />
    );
  };

  const showBulkBar =
    selectedRows.length > 0 && ((bulkActions?.length ?? 0) > 0 || onBulkAction != null);

  return (
    <View style={{ flex: 1 }}>
      {showGlobalFilter ? (
        <TextInput
          value={state.globalFilter}
          onChangeText={(text) => table.setGlobalFilter(text)}
          placeholder={labels.search}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={labels.search}
          style={{
            ...textStyle,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: tokens.radius.control,
            backgroundColor: colors.surface,
            paddingHorizontal: 10,
            paddingVertical: 8,
            marginBottom: 10,
          }}
        />
      ) : null}
      {showBulkBar ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          <Text style={mutedText}>{labels.selectedCount(selectedRows.length)}</Text>
          {(bulkActions ?? []).map((action) => (
            <Pressable
              key={action.id}
              accessibilityRole="button"
              onPress={() => onBulkAction?.(action.id, selectedRows)}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: tokens.radius.control,
                paddingHorizontal: 10,
                paddingVertical: 5,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={textStyle}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <ScrollView
        horizontal
        bounces={false}
        showsHorizontalScrollIndicator
        contentContainerStyle={{ flexGrow: 1 }}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: tokens.radius.container,
          backgroundColor: colors.surface,
        }}
      >
        <View style={{ flex: 1, minWidth: minTableWidth }}>
          {renderHeader()}
          <View style={{ flex: 1 }}>{renderBody()}</View>
        </View>
      </ScrollView>

      {showPagination !== false ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 10,
            gap: 10,
          }}
        >
          <Text style={mutedText} accessibilityLiveRegion="polite">
            {labels.pageInfo(
              state.pagination.pageIndex + 1,
              table.getPageCount(),
              table.getTotalCount(),
            )}
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={labels.previousPage}
              disabled={!table.getCanPreviousPage()}
              onPress={() => table.previousPage()}
              style={{
                opacity: table.getCanPreviousPage() ? 1 : 0.4,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: tokens.radius.control,
                paddingHorizontal: 14,
                paddingVertical: 6,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={textStyle}>‹</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={labels.nextPage}
              disabled={!table.getCanNextPage()}
              onPress={() => table.nextPage()}
              style={{
                opacity: table.getCanNextPage() ? 1 : 0.4,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: tokens.radius.control,
                paddingHorizontal: 14,
                paddingVertical: 6,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={textStyle}>›</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
