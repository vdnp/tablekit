import type { ColumnDef, Row, SortingState } from "../types";

/**
 * Null-safe default comparator: numbers/dates/booleans/bigints compared
 * natively, everything else via locale-aware, numeric-friendly string
 * comparison. null/undefined (and NaN) always sort last regardless of
 * direction handling by the caller.
 */
export function defaultCompare(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") {
    const aNaN = Number.isNaN(a);
    const bNaN = Number.isNaN(b);
    if (aNaN && bNaN) return 0;
    if (aNaN) return 1;
    if (bNaN) return -1;
    return a - b;
  }
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "boolean" && typeof b === "boolean") return a === b ? 0 : a ? 1 : -1;
  if (typeof a === "bigint" && typeof b === "bigint") return a < b ? -1 : a > b ? 1 : 0;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

/**
 * Stable multi-column sort. Rows compare equal on all sort columns keep
 * their original data order.
 */
export function sortRows<TData>(
  rows: readonly Row<TData>[],
  sorting: SortingState,
  defsById: ReadonlyMap<string, ColumnDef<TData>>,
): Row<TData>[] {
  if (sorting.length === 0) return [...rows];
  return [...rows].sort((a, b) => {
    for (const sort of sorting) {
      const def = defsById.get(sort.id);
      if (def?.sortFn) {
        const compared = def.sortFn(a, b, sort.id);
        if (compared !== 0) return sort.desc ? -compared : compared;
        continue;
      }
      const aValue = a.getValue(sort.id);
      const bValue = b.getValue(sort.id);
      // null/undefined sort last regardless of direction
      if (aValue == null || bValue == null) {
        if (aValue == null && bValue == null) continue;
        return aValue == null ? 1 : -1;
      }
      const compared = defaultCompare(aValue, bValue);
      if (compared !== 0) return sort.desc ? -compared : compared;
    }
    return a.index - b.index;
  });
}
