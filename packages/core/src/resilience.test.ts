import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTable } from "./create-table";
import type { ColumnDef } from "./types";
import { resetDevWarnings } from "./utils/dev";

interface Loose {
  name?: string | null;
  score?: number | null;
}

const messyData: Loose[] = [
  { name: "a", score: 3 },
  { name: null, score: null },
  {},
  { name: "b" },
];

let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  resetDevWarnings();
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe("resilience", () => {
  it("renders empty data without crashing", () => {
    const table = createTable<Loose>({
      columns: [{ accessorKey: "name" }],
      data: [],
    });
    expect(table.getRowModel().flatRows).toEqual([]);
    expect(table.getPageCount()).toBe(1);
    expect(table.getIsAllRowsSelected()).toBe(false);
  });

  it("handles null/undefined cell values in filter and sort", () => {
    const table = createTable<Loose>({
      columns: [
        { accessorKey: "name", sortable: true },
        { accessorKey: "score", sortable: true },
      ],
      data: messyData,
    });
    table.setSorting([{ id: "score", desc: false }]);
    const scores = table.getRowModel().flatRows.map((row) => row.original.score ?? null);
    expect(scores[0]).toBe(3); // real values first, null/undefined last
    table.setGlobalFilter("b");
    expect(table.getRowModel().flatRows).toHaveLength(1);
  });

  it("warns (dev) when a column has no id and no accessor", () => {
    const table = createTable<Loose>({
      columns: [{ header: "Mystery" }],
      data: messyData,
    });
    table.getRowModel();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('neither "id" nor "accessorKey"'));
  });

  it("warns (dev) when both data and fetchData are provided", () => {
    createTable<Loose>({
      columns: [{ accessorKey: "name" }],
      data: messyData,
      fetchData: () => Promise.resolve({ rows: [], totalCount: 0 }),
    });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"fetchData" wins'));
  });

  it("recovers when accessorFn throws", () => {
    const explosive: ColumnDef<Loose> = {
      id: "boom",
      accessorFn: () => {
        throw new Error("kaboom");
      },
    };
    const table = createTable<Loose>({ columns: [explosive], data: messyData });
    expect(table.getRowModel().flatRows[0]!.getValue("boom")).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("accessorFn"));
  });

  it("treats malformed fetchData results as empty instead of crashing", async () => {
    const table = createTable<Loose>({
      columns: [{ accessorKey: "name" }],
      // deliberately wrong shape
      fetchData: () => Promise.resolve({ items: [] } as never),
    });
    table.mount();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(table.getRowModel().flatRows).toEqual([]);
    expect(table.getTotalCount()).toBe(0);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("fetchData must resolve"));
  });

  it("warns on duplicate row ids", () => {
    const table = createTable<Loose>({
      columns: [{ accessorKey: "name" }],
      data: messyData,
      getRowId: () => "same",
    });
    table.getRowModel();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Duplicate row id"));
  });
});
