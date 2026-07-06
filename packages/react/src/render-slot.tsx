"use client";

import { devWarn } from "@tablekit/core";
import { isValidElement } from "react";
import type { ReactNode } from "react";

/**
 * Narrow core's `unknown` render-slot results to something React can render.
 * Objects that are not elements are dropped (with a dev warning) instead of
 * crashing the tree.
 */
export function renderSlot(value: unknown): ReactNode {
  if (value == null || typeof value === "boolean") return null;
  if (typeof value === "string" || typeof value === "number") return value;
  if (isValidElement(value)) return value;
  if (Array.isArray(value)) return value.map((item) => renderSlot(item));
  devWarn(
    true,
    `A header/cell render returned a non-renderable value (${Object.prototype.toString.call(value)}). Rendering nothing.`,
  );
  return null;
}

/** Default cell formatting for raw values: null-safe, locale-stable. */
export function formatCellValue(value: unknown): ReactNode {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  if (typeof value === "boolean") return value ? "✓" : "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  devWarn(
    true,
    `Cell received a non-primitive value (${Object.prototype.toString.call(value)}). Provide a custom "cell" renderer for this column.`,
  );
  return "";
}
