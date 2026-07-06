import { beforeEach, describe, expect, it, vi } from "vitest";
import { createColumnHelper } from "./column-helper";
import { createTable } from "./create-table";
import type { FetchParams, FetchResult } from "./types";
import { resetDevWarnings } from "./utils/dev";

interface Item {
  id: number;
  label: string;
}

const allItems: Item[] = Array.from({ length: 45 }, (_, index) => ({
  id: index + 1,
  label: `Item ${index + 1}`,
}));

const helper = createColumnHelper<Item>();
const columns = [helper.accessor("id", { sortable: true }), helper.accessor("label")];

function fakeServer(params: FetchParams): Promise<FetchResult<Item>> {
  let rows = [...allItems];
  const query = params.globalFilter.toLowerCase();
  if (query) rows = rows.filter((item) => item.label.toLowerCase().includes(query));
  const total = rows.length;
  const start = params.pageIndex * params.pageSize;
  return Promise.resolve({ rows: rows.slice(start, start + params.pageSize), totalCount: total });
}

const flushMicrotasks = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

beforeEach(() => resetDevWarnings());

describe("server mode", () => {
  it("does not fetch before mount (SSR safety)", async () => {
    const fetchData = vi.fn(fakeServer);
    createTable<Item>({ columns, fetchData });
    await flushMicrotasks();
    expect(fetchData).not.toHaveBeenCalled();
  });

  it("fetches on mount and exposes rows/totalCount", async () => {
    const fetchData = vi.fn(fakeServer);
    const table = createTable<Item>({ columns, fetchData });
    table.mount();
    await flushMicrotasks();
    expect(fetchData).toHaveBeenCalledOnce();
    expect(table.getRowModel().flatRows).toHaveLength(10);
    expect(table.getTotalCount()).toBe(45);
    expect(table.getPageCount()).toBe(5);
  });

  it("refetches when pagination or search changes, coalescing sync updates", async () => {
    const fetchData = vi.fn(fakeServer);
    const table = createTable<Item>({ columns, fetchData });
    table.mount();
    await flushMicrotasks();
    fetchData.mockClear();

    // Global filter change also resets the page index — one fetch, not two.
    table.setPageIndex(2);
    await flushMicrotasks();
    table.setGlobalFilter("item 1");
    await flushMicrotasks();
    expect(fetchData).toHaveBeenCalledTimes(2);
    const lastParams = fetchData.mock.calls.at(-1)![0];
    expect(lastParams.pageIndex).toBe(0);
    expect(lastParams.globalFilter).toBe("item 1");
  });

  it("ignores stale responses (race protection)", async () => {
    const resolvers: Array<(result: FetchResult<Item>) => void> = [];
    const fetchData = vi.fn(
      () => new Promise<FetchResult<Item>>((resolve) => resolvers.push(resolve)),
    );
    const table = createTable<Item>({ columns, fetchData });
    table.mount();
    await flushMicrotasks();
    table.setGlobalFilter("newer");
    await flushMicrotasks();
    expect(resolvers).toHaveLength(2);

    // Resolve in reverse order: newer first, then the stale one.
    resolvers[1]!({ rows: [{ id: 99, label: "newer" }], totalCount: 1 });
    await flushMicrotasks();
    resolvers[0]!({ rows: allItems.slice(0, 10), totalCount: 45 });
    await flushMicrotasks();

    expect(table.getRowModel().flatRows.map((row) => row.original.id)).toEqual([99]);
    expect(table.getTotalCount()).toBe(1);
  });

  it("surfaces fetch errors via getError and onError without swallowing", async () => {
    const failure = new Error("boom");
    const onError = vi.fn();
    const table = createTable<Item>({
      columns,
      fetchData: () => Promise.reject(failure),
      onError,
    });
    table.mount();
    await flushMicrotasks();
    expect(table.getError()).toBe(failure);
    expect(onError).toHaveBeenCalledWith(failure);
    expect(table.getIsLoading()).toBe(false);
  });

  it("clears the error after a successful refetch", async () => {
    let shouldFail = true;
    const table = createTable<Item>({
      columns,
      fetchData: (params) =>
        shouldFail ? Promise.reject(new Error("down")) : fakeServer(params),
    });
    table.mount();
    await flushMicrotasks();
    expect(table.getError()).toBeInstanceOf(Error);

    shouldFail = false;
    await table.refetch();
    expect(table.getError()).toBeUndefined();
    expect(table.getRowModel().flatRows).toHaveLength(10);
  });

  it("tracks loading state around the fetch", async () => {
    let resolveFetch: ((result: FetchResult<Item>) => void) | undefined;
    const table = createTable<Item>({
      columns,
      fetchData: () => new Promise((resolve) => (resolveFetch = resolve)),
    });
    table.mount();
    expect(table.getIsLoading()).toBe(true);
    resolveFetch!({ rows: [], totalCount: 0 });
    await flushMicrotasks();
    expect(table.getIsLoading()).toBe(false);
  });

  it("stops fetching after unmount", async () => {
    const fetchData = vi.fn(fakeServer);
    const table = createTable<Item>({ columns, fetchData });
    const unmount = table.mount();
    await flushMicrotasks();
    fetchData.mockClear();
    unmount();
    table.setPageIndex(1);
    await flushMicrotasks();
    expect(fetchData).not.toHaveBeenCalled();
  });
});
