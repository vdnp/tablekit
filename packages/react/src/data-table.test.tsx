import { resetDevWarnings } from "@vdnp/tablekit-core";
import type { FetchParams, FetchResult } from "@vdnp/tablekit-core";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DataTable } from "./data-table";
import { useDataTable } from "./use-data-table";

interface Fruit {
  id: number;
  name: string;
  color: string;
  stock: number;
}

const fruits: Fruit[] = [
  { id: 1, name: "Banana", color: "yellow", stock: 12 },
  { id: 2, name: "Apple", color: "red", stock: 5 },
  { id: 3, name: "Cherry", color: "red", stock: 0 },
];

const columns = [
  { accessorKey: "name" as const, header: "Name", sortable: true },
  { accessorKey: "color" as const, header: "Color" },
  { accessorKey: "stock" as const, header: "Stock", sortable: true },
];

const getRowId = (fruit: Fruit) => String(fruit.id);

beforeEach(() => resetDevWarnings());

describe("<DataTable /> client mode", () => {
  it("renders headers and rows", () => {
    render(<DataTable columns={columns} data={fruits} getRowId={getRowId} />);
    expect(screen.getByRole("columnheader", { name: "Color" })).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(4); // header + 3
  });

  it("sorts when a sortable header is clicked and sets aria-sort", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={fruits} getRowId={getRowId} />);
    await user.click(screen.getByRole("button", { name: /name/i }));
    const header = screen.getByRole("columnheader", { name: /name/i });
    expect(header).toHaveAttribute("aria-sort", "ascending");
    const cells = screen.getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("cell")[0]!.textContent);
    expect(cells).toEqual(["Apple", "Banana", "Cherry"]);
  });

  it("filters via the global search input", async () => {
    const user = userEvent.setup();
    render(
      <DataTable columns={columns} data={fruits} getRowId={getRowId} showGlobalFilter />,
    );
    await user.type(screen.getByRole("searchbox"), "red");
    expect(screen.queryByText("Banana")).not.toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
  });

  it("shows the empty state (custom renderEmpty wins)", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        renderEmpty={() => <p>Nothing here, chief.</p>}
      />,
    );
    expect(screen.getByText("Nothing here, chief.")).toBeInTheDocument();
  });

  it("selection + bulk actions flow", async () => {
    const user = userEvent.setup();
    const onBulkAction = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={fruits}
        getRowId={getRowId}
        enableSelection
        bulkActions={[{ id: "archive", label: "Archive" }]}
        onBulkAction={onBulkAction}
      />,
    );
    await user.click(screen.getAllByRole("checkbox", { name: "Select row" })[0]!);
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Archive" }));
    expect(onBulkAction).toHaveBeenCalledWith(
      "archive",
      expect.arrayContaining([expect.objectContaining({ id: "1" })]),
    );
  });

  it("row click and Enter key both fire onRowClick", async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(
      <DataTable columns={columns} data={fruits} getRowId={getRowId} onRowClick={onRowClick} />,
    );
    const bananaRow = screen.getByText("Banana").closest("tr")!;
    await user.click(bananaRow);
    expect(onRowClick).toHaveBeenCalledTimes(1);
    bananaRow.focus();
    await user.keyboard("{Enter}");
    expect(onRowClick).toHaveBeenCalledTimes(2);
    expect(onRowClick.mock.calls[1]![0].original.name).toBe("Banana");
  });

  it("renders edit/delete action buttons when handlers are given", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <DataTable columns={columns} data={fruits} getRowId={getRowId} onDelete={onDelete} />,
    );
    await user.click(screen.getAllByRole("button", { name: "Delete" })[1]!);
    expect(onDelete.mock.calls[0]![0].original.name).toBe("Apple");
  });

  it("paginates with footer controls", async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={fruits}
        getRowId={getRowId}
        initialState={{ pagination: { pageIndex: 0, pageSize: 2 } }}
      />,
    );
    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    expect(screen.queryByText("Cherry")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("Cherry")).toBeInTheDocument();
  });
});

describe("<DataTable /> server mode", () => {
  function fetchFruits(params: FetchParams): Promise<FetchResult<Fruit>> {
    const start = params.pageIndex * params.pageSize;
    return Promise.resolve({
      rows: fruits.slice(start, start + params.pageSize),
      totalCount: fruits.length,
    });
  }

  it("shows skeleton while loading, then rows", async () => {
    let resolveFetch: ((result: FetchResult<Fruit>) => void) | undefined;
    const fetchData = () =>
      new Promise<FetchResult<Fruit>>((resolve) => {
        resolveFetch = resolve;
      });
    const { container } = render(
      <DataTable columns={columns} fetchData={fetchData} getRowId={getRowId} />,
    );
    await waitFor(() => expect(container.querySelector(".tk-skeleton")).toBeInTheDocument());
    resolveFetch!({ rows: fruits, totalCount: 3 });
    await waitFor(() => expect(screen.getByText("Banana")).toBeInTheDocument());
  });

  it("renders the error state with a working retry", async () => {
    const user = userEvent.setup();
    let shouldFail = true;
    const onError = vi.fn();
    const fetchData = (params: FetchParams) =>
      shouldFail ? Promise.reject(new Error("api down")) : fetchFruits(params);
    render(
      <DataTable columns={columns} fetchData={fetchData} getRowId={getRowId} onError={onError} />,
    );
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(onError).toHaveBeenCalled();

    shouldFail = false;
    await user.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(screen.getByText("Banana")).toBeInTheDocument());
  });

  it("supports a custom renderError", async () => {
    render(
      <DataTable
        columns={columns}
        fetchData={() => Promise.reject(new Error("nope"))}
        renderError={(error) => <p>Custom: {(error as Error).message}</p>}
      />,
    );
    await waitFor(() => expect(screen.getByText("Custom: nope")).toBeInTheDocument());
  });
});

describe("headless usage via useDataTable", () => {
  function HeadlessList() {
    const table = useDataTable<Fruit>({ columns, data: fruits, getRowId });
    return (
      <div>
        <button type="button" onClick={() => table.setGlobalFilter("apple")}>
          only apples
        </button>
        <ul>
          {table.getRowModel().flatRows.map((row) => (
            <li key={row.id}>{row.original.name}</li>
          ))}
        </ul>
      </div>
    );
  }

  it("drives custom markup from the same core", async () => {
    const user = userEvent.setup();
    render(<HeadlessList />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: "only apples" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("Apple")).toBeInTheDocument();
  });

  it("passes a prebuilt table to <DataTable /> (controlled from outside)", async () => {
    const user = userEvent.setup();
    function Wrapper() {
      const table = useDataTable<Fruit>({ columns, data: fruits, getRowId });
      return (
        <div>
          <button type="button" onClick={() => table.setGlobalFilter("cherry")}>
            external filter
          </button>
          <DataTable table={table} />
        </div>
      );
    }
    render(<Wrapper />);
    expect(screen.getByText("Banana")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "external filter" }));
    expect(screen.queryByText("Banana")).not.toBeInTheDocument();
    expect(screen.getByText("Cherry")).toBeInTheDocument();
  });
});
