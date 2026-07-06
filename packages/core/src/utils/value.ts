import type { ColumnDef } from "../types";
import { devWarn } from "./dev";

/** Resolve a column's id: explicit id wins, then accessorKey. */
export function resolveColumnId<TData>(def: ColumnDef<TData>, index: number): string {
  if (def.id) return def.id;
  if (def.accessorKey) return def.accessorKey;
  devWarn(
    true,
    `Column at index ${index} has neither "id" nor "accessorKey". ` +
      `A positional id "col_${index}" was generated; provide an explicit id.`,
  );
  return `col_${index}`;
}

/**
 * Read a cell value without ever throwing: accessorFn first, then
 * accessorKey, with null/undefined rows tolerated.
 */
export function readCellValue<TData>(
  def: ColumnDef<TData>,
  row: TData,
  rowIndex: number,
): unknown {
  if (def.accessorFn) {
    try {
      return def.accessorFn(row, rowIndex);
    } catch (error) {
      devWarn(
        true,
        `accessorFn for column "${def.id ?? def.accessorKey ?? "?"}" threw: ${String(error)}. ` +
          `Returning undefined for this cell.`,
      );
      return undefined;
    }
  }
  if (def.accessorKey != null) {
    if (row == null || typeof row !== "object") return undefined;
    return (row as Record<string, unknown>)[def.accessorKey];
  }
  return undefined;
}

/** Normalize a value for text matching: null-safe, lower-cased string. */
export function toComparableString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.toLowerCase();
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value).toLowerCase();
  }
  if (value instanceof Date) return value.toISOString().toLowerCase();
  return "";
}
