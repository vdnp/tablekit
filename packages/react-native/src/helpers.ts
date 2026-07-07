import type { Column } from "@tablekit/core";

export interface CellLayout {
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;
  alignItems: "flex-start" | "center" | "flex-end";
}

/**
 * Pure layout math for a column cell: fixed width when provided, otherwise
 * flex: 1 so unsized columns share the remaining space.
 */
export function cellLayout<TData>(column: Column<TData>): CellLayout {
  const { width, minWidth, maxWidth, align } = column.def;
  return {
    width,
    minWidth,
    maxWidth,
    flex: width == null ? 1 : undefined,
    alignItems: align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start",
  };
}

/** Default text shown for a raw cell value; null-safe and locale-stable. */
export function formatCellText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  if (typeof value === "boolean") return value ? "✓" : "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return "";
}
