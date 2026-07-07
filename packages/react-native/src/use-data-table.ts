import { createTable } from "@tablekit/core";
import type { Table, TableOptions } from "@tablekit/core";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/**
 * Headless entry point for React Native — identical contract to
 * @tablekit/react's hook, duplicated here so neither adapter depends on
 * the other (see CLAUDE.md dependency rules).
 */
export function useDataTable<TData>(options: TableOptions<TData>): Table<TData> {
  const [table] = useState(() => createTable(options));

  table.setOptions(options);

  const subscribe = useCallback(
    (onStoreChange: () => void) => table.subscribe(onStoreChange),
    [table],
  );
  const getSnapshot = useCallback(() => table.getVersion(), [table]);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => table.mount(), [table]);

  return table;
}
