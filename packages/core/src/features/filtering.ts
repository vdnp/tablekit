import type { ColumnDef, ColumnFiltersState, Row } from "../types";
import { toComparableString } from "../utils/value";

/**
 * Default column filter:
 * - empty filter (null/undefined/"" or empty array) matches everything
 * - string filter → case-insensitive substring match
 * - array filter → membership (Object.is or string-equal)
 * - anything else → Object.is equality
 */
export function defaultFilterFn(value: unknown, filterValue: unknown): boolean {
  if (filterValue == null || filterValue === "") return true;
  if (Array.isArray(filterValue)) {
    if (filterValue.length === 0) return true;
    return filterValue.some(
      (candidate) =>
        Object.is(candidate, value) ||
        (toComparableString(candidate) !== "" &&
          toComparableString(candidate) === toComparableString(value)),
    );
  }
  if (typeof filterValue === "string") {
    return toComparableString(value).includes(filterValue.toLowerCase());
  }
  return Object.is(value, filterValue);
}

function isColumnFilterable<TData>(def: ColumnDef<TData>): boolean {
  if (def.filterable === false) return false;
  return def.accessorKey != null || def.accessorFn != null;
}

/** Apply per-column filters, then the global search string. */
export function filterRows<TData>(
  rows: readonly Row<TData>[],
  columnFilters: ColumnFiltersState,
  globalFilter: string,
  defsById: ReadonlyMap<string, ColumnDef<TData>>,
): Row<TData>[] {
  let result: readonly Row<TData>[] = rows;

  const activeFilters = columnFilters.filter((filter) => {
    const def = defsById.get(filter.id);
    return def != null && isColumnFilterable(def);
  });

  if (activeFilters.length > 0) {
    result = result.filter((row) =>
      activeFilters.every((filter) => {
        const def = defsById.get(filter.id);
        if (!def) return true;
        const value = row.getValue(filter.id);
        return def.filterFn
          ? def.filterFn(value, filter.value, row)
          : defaultFilterFn(value, filter.value);
      }),
    );
  }

  const query = globalFilter.trim().toLowerCase();
  if (query !== "") {
    const searchableIds: string[] = [];
    for (const [id, def] of defsById) {
      if (isColumnFilterable(def)) searchableIds.push(id);
    }
    result = result.filter((row) =>
      searchableIds.some((id) => toComparableString(row.getValue(id)).includes(query)),
    );
  }

  return [...result];
}
