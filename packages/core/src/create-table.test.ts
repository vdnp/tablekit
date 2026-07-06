import { beforeEach, describe, expect, it, vi } from "vitest";
import { createColumnHelper } from "./column-helper";
import { createTable } from "./create-table";
import type { SortingState, TableOptions } from "./types";
import { resetDevWarnings } from "./utils/dev";

interface Person {
  id: number;
  name: string;
  age: number | null;
  city: string;
}

const people: Person[] = [
  { id: 1, name: "Ada", age: 36, city: "London" },
  { id: 2, name: "Grace", age: 85, city: "Washington" },
  { id: 3, name: "Alan", age: 41, city: "London" },
  { id: 4, name: "Linus", age: null, city: "Helsinki" },
  { id: 5, name: "Margaret", age: 55, city: "Boston" },
];

const helper = createColumnHelper<Person>();
const columns = [
  helper.accessor("name", { sortable: true }),
  helper.accessor("age", { sortable: true }),
  helper.accessor("city", { sortable: true }),
];

function makeTable(overrides: Partial<TableOptions<Person>> = {}) {
  return createTable<Person>({
    columns,
    data: people,
    getRowId: (row) => String(row.id),
    ...overrides,
  });
}

beforeEach(() => resetDevWarnings());

describe("row model basics", () => {
  it("exposes rows in data order by default", () => {
    const table = makeTable();
    expect(table.getRowModel().flatRows.map((row) => row.original.name)).toEqual([
      "Ada",
      "Grace",
      "Alan",
      "Linus",
      "Margaret",
    ]);
    expect(table.getTotalCount()).toBe(5);
  });

  it("reads cell values via getValue and tolerates unknown columns", () => {
    const table = makeTable();
    const first = table.getRowModel().flatRows[0]!;
    expect(first.getValue("name")).toBe("Ada");
    expect(first.getValue("nope")).toBeUndefined();
  });
});

describe("sorting", () => {
  it("sorts ascending and descending with nulls last", () => {
    const table = makeTable();
    table.setSorting([{ id: "age", desc: false }]);
    expect(table.getRowModel().flatRows.map((row) => row.original.name)).toEqual([
      "Ada",
      "Alan",
      "Margaret",
      "Grace",
      "Linus", // null age sorts last
    ]);
    table.setSorting([{ id: "age", desc: true }]);
    expect(table.getRowModel().flatRows.map((row) => row.original.name)).toEqual([
      "Grace",
      "Margaret",
      "Alan",
      "Ada",
      "Linus", // null still last when descending
    ]);
  });

  it("cycles none → asc → desc → none via column.toggleSorting", () => {
    const table = makeTable();
    const nameColumn = table.getColumn("name")!;
    nameColumn.toggleSorting();
    expect(nameColumn.getIsSorted()).toBe("asc");
    nameColumn.toggleSorting();
    expect(nameColumn.getIsSorted()).toBe("desc");
    nameColumn.toggleSorting();
    expect(nameColumn.getIsSorted()).toBe(false);
  });

  it("supports custom sortFn", () => {
    const table = makeTable({
      columns: [
        helper.accessor("name", {
          sortable: true,
          sortFn: (a, b) => a.original.name.length - b.original.name.length,
        }),
      ],
    });
    table.setSorting([{ id: "name", desc: false }]);
    expect(table.getRowModel().flatRows[0]!.original.name).toBe("Ada");
    expect(table.getRowModel().flatRows.at(-1)!.original.name).toBe("Margaret");
  });
});

describe("filtering", () => {
  it("applies string column filters case-insensitively", () => {
    const table = makeTable();
    table.setColumnFilter("city", "lond");
    expect(table.getRowModel().flatRows.map((row) => row.original.name)).toEqual([
      "Ada",
      "Alan",
    ]);
    expect(table.getTotalCount()).toBe(2);
  });

  it("clears a filter when value is empty", () => {
    const table = makeTable();
    table.setColumnFilter("city", "lond");
    table.setColumnFilter("city", "");
    expect(table.getTotalCount()).toBe(5);
    expect(table.getState().columnFilters).toEqual([]);
  });

  it("applies global filter across filterable columns", () => {
    const table = makeTable();
    table.setGlobalFilter("gra");
    expect(table.getRowModel().flatRows.map((row) => row.original.name)).toEqual(["Grace"]);
  });

  it("supports custom filterFn and array filter values", () => {
    const table = makeTable();
    table.setColumnFilter("city", ["London", "Boston"]);
    expect(table.getTotalCount()).toBe(3);
  });

  it("resets page index when filters change", () => {
    const table = makeTable({
      initialState: { pagination: { pageIndex: 1, pageSize: 2 } },
    });
    expect(table.getState().pagination.pageIndex).toBe(1);
    table.setGlobalFilter("a");
    expect(table.getState().pagination.pageIndex).toBe(0);
  });
});

describe("pagination", () => {
  it("slices pages and reports page count", () => {
    const table = makeTable({ initialState: { pagination: { pageIndex: 0, pageSize: 2 } } });
    expect(table.getPageCount()).toBe(3);
    expect(table.getRowModel().flatRows).toHaveLength(2);
    expect(table.getCanPreviousPage()).toBe(false);
    table.nextPage();
    expect(table.getState().pagination.pageIndex).toBe(1);
    expect(table.getRowModel().flatRows.map((row) => row.original.name)).toEqual([
      "Alan",
      "Linus",
    ]);
  });

  it("clamps page index to valid range", () => {
    const table = makeTable({ initialState: { pagination: { pageIndex: 0, pageSize: 2 } } });
    table.setPageIndex(99);
    expect(table.getState().pagination.pageIndex).toBe(2);
    table.setPageIndex(-5);
    expect(table.getState().pagination.pageIndex).toBe(0);
  });

  it("keeps the first visible row in view when page size changes", () => {
    const table = makeTable({ initialState: { pagination: { pageIndex: 2, pageSize: 2 } } });
    table.setPageSize(4);
    expect(table.getState().pagination.pageIndex).toBe(1);
  });
});

describe("selection", () => {
  it("toggles individual rows and select-all over the filtered set", () => {
    const table = makeTable();
    table.toggleRowSelected("1");
    expect(table.getSelectedRows().map((row) => row.original.name)).toEqual(["Ada"]);
    expect(table.getIsSomeRowsSelected()).toBe(true);

    table.setColumnFilter("city", "London");
    table.toggleAllRowsSelected(true);
    expect(table.getIsAllRowsSelected()).toBe(true);
    // Only the 2 filtered rows (Ada was already selected and is in the set)
    expect(table.getSelectedRows()).toHaveLength(2);

    table.toggleAllRowsSelected(false);
    expect(table.getSelectedRows()).toHaveLength(0);
  });
});

describe("grouping and expanding", () => {
  it("groups rows by column and expands by default", () => {
    const table = makeTable({ initialState: { grouping: ["city"] } });
    const model = table.getRowModel();
    const groupRow = model.rows[0]!;
    expect(groupRow.isGroupRow).toBe(true);
    expect(groupRow.groupValue).toBe("London");
    expect(groupRow.subRows).toHaveLength(2);
    // flatRows include group headers + visible children
    expect(model.flatRows.filter((row) => row.isGroupRow)).toHaveLength(4);
    expect(model.flatRows.filter((row) => !row.isGroupRow)).toHaveLength(5);
  });

  it("collapsing a group hides its children from flatRows", () => {
    const table = makeTable({
      initialState: { grouping: ["city"], pagination: { pageIndex: 0, pageSize: 50 } },
    });
    const groupRow = table.getRowModel().rows[0]!;
    groupRow.toggleExpanded();
    const flat = table.getRowModel().flatRows;
    expect(flat.filter((row) => !row.isGroupRow)).toHaveLength(3);
  });

  it("selecting a group row selects all its leaves", () => {
    const table = makeTable({ initialState: { grouping: ["city"] } });
    const groupRow = table.getRowModel().rows[0]!;
    groupRow.toggleSelected(true);
    expect(table.getSelectedRows().map((row) => row.original.city)).toEqual([
      "London",
      "London",
    ]);
    expect(groupRow.getIsSelected()).toBe(true);
  });
});

describe("controlled state", () => {
  it("routes changes through the callback without mutating internal state", () => {
    let sorting: SortingState = [];
    const onSortingChange = vi.fn((next: SortingState) => {
      sorting = next;
    });
    const table = makeTable({ state: { sorting }, onSortingChange });

    table.setSorting([{ id: "name", desc: false }]);
    expect(onSortingChange).toHaveBeenCalledOnce();
    // still controlled by the old value until the caller passes the new state
    expect(table.getState().sorting).toEqual([]);

    table.setOptions({
      columns,
      data: people,
      getRowId: (row) => String(row.id),
      state: { sorting },
      onSortingChange,
    });
    expect(table.getState().sorting).toEqual([{ id: "name", desc: false }]);
  });

  it("uncontrolled slices still notify their callbacks", () => {
    const onPaginationChange = vi.fn();
    const table = makeTable({
      onPaginationChange,
      initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
    });
    table.nextPage();
    expect(onPaginationChange).toHaveBeenCalledWith({ pageIndex: 1, pageSize: 2 });
    expect(table.getState().pagination.pageIndex).toBe(1);
  });

  it("nextPage is a no-op on the last page (no spurious callback)", () => {
    const onPaginationChange = vi.fn();
    const table = makeTable({ onPaginationChange }); // 5 rows, pageSize 10 → 1 page
    table.nextPage();
    expect(onPaginationChange).not.toHaveBeenCalled();
    expect(table.getState().pagination.pageIndex).toBe(0);
  });
});

describe("subscribe/version", () => {
  it("notifies subscribers once per state change and bumps version", () => {
    const table = makeTable();
    const listener = vi.fn();
    const unsubscribe = table.subscribe(listener);
    const before = table.getVersion();
    table.setGlobalFilter("a");
    expect(listener).toHaveBeenCalled();
    expect(table.getVersion()).toBeGreaterThan(before);
    unsubscribe();
    listener.mockClear();
    table.setGlobalFilter("b");
    expect(listener).not.toHaveBeenCalled();
  });
});
