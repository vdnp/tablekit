"use client";

import { createTable } from "@tablekit/core";
import type { Table, TableOptions } from "@tablekit/core";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/**
 * Headless entry point: owns a table instance across renders, keeps its
 * options fresh, and subscribes the component to state changes.
 *
 * SSR-safe: the instance performs no side effects until mounted in an
 * effect, and `useSyncExternalStore` provides a server snapshot.
 */
export function useDataTable<TData>(options: TableOptions<TData>): Table<TData> {
  const [table] = useState(() => createTable(options));

  // Re-point the instance at this render's options/data/callbacks.
  table.setOptions(options);

  const subscribe = useCallback(
    (onStoreChange: () => void) => table.subscribe(onStoreChange),
    [table],
  );
  const getSnapshot = useCallback(() => table.getVersion(), [table]);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Starts server-mode fetching on the client only; cleanup cancels in-flight work.
  useEffect(() => table.mount(), [table]);

  return table;
}
