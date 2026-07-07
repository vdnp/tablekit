import { describe, expect, it } from "vitest";
import type { Column } from "@tablekit/core";
import { cellLayout, formatCellText } from "./helpers";

function fakeColumn(def: Partial<Column<unknown>["def"]>): Column<unknown> {
  return { def } as Column<unknown>;
}

describe("cellLayout", () => {
  it("uses flex: 1 when no width is set", () => {
    expect(cellLayout(fakeColumn({}))).toMatchObject({ flex: 1, width: undefined });
  });

  it("uses fixed width when provided and drops flex", () => {
    expect(cellLayout(fakeColumn({ width: 120 }))).toMatchObject({
      width: 120,
      flex: undefined,
    });
  });

  it("maps align to alignItems", () => {
    expect(cellLayout(fakeColumn({ align: "right" })).alignItems).toBe("flex-end");
    expect(cellLayout(fakeColumn({ align: "center" })).alignItems).toBe("center");
    expect(cellLayout(fakeColumn({})).alignItems).toBe("flex-start");
  });
});

describe("formatCellText", () => {
  it("is null-safe", () => {
    expect(formatCellText(null)).toBe("");
    expect(formatCellText(undefined)).toBe("");
  });

  it("formats primitives and dates", () => {
    expect(formatCellText("x")).toBe("x");
    expect(formatCellText(42)).toBe("42");
    expect(formatCellText(true)).toBe("✓");
    expect(formatCellText(new Date("2026-07-07T10:00:00Z"))).toBe("2026-07-07");
  });

  it("refuses to render plain objects", () => {
    expect(formatCellText({ nested: 1 })).toBe("");
  });
});
