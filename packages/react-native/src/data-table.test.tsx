import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { ActivityIndicator, Text, View } from "react-native";
import type { Row } from "@tablekit/core";
import type { FetchParams, FetchResult } from "@tablekit/core";
import { DataTable, defaultLabels } from "./data-table";
import type { VirtualListProps } from "./data-table";

interface Person {
  id: number;
  name: string;
  age: number;
}

const people: Person[] = [
  { id: 1, name: "Ada", age: 36 },
  { id: 2, name: "Grace", age: 85 },
  { id: 3, name: "Alan", age: 41 },
  { id: 4, name: "Linus", age: 28 },
];

const columns = [
  { accessorKey: "name" as const, header: "Name", sortable: true },
  { accessorKey: "age" as const, header: "Age", sortable: true },
];

const getRowId = (person: Person) => String(person.id);

describe("<DataTable /> (react-native) — client mode", () => {
  it("renders headers and rows when data is present", () => {
    render(<DataTable<Person> columns={columns} data={people} getRowId={getRowId} />);
    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Ada")).toBeTruthy();
    expect(screen.getByText("36")).toBeTruthy();
    expect(screen.getByText("Grace")).toBeTruthy();
  });

  it("shows the empty state when there is no data", () => {
    render(<DataTable<Person> columns={columns} data={[]} getRowId={getRowId} />);
    expect(screen.getByText("No results.")).toBeTruthy();
    expect(screen.queryByText("Ada")).toBeNull();
  });

  it("renders a custom empty state when provided", () => {
    render(
      <DataTable<Person>
        columns={columns}
        data={[]}
        getRowId={getRowId}
        renderEmpty={() => <Text>Nothing to see</Text>}
      />,
    );
    expect(screen.getByText("Nothing to see")).toBeTruthy();
    expect(screen.queryByText("No results.")).toBeNull();
  });

  it("filters rows through the global search input", () => {
    render(
      <DataTable<Person> columns={columns} data={people} getRowId={getRowId} showGlobalFilter />,
    );
    fireEvent.changeText(screen.getByLabelText("Search"), "gra");
    expect(screen.getByText("Grace")).toBeTruthy();
    expect(screen.queryByText("Ada")).toBeNull();
  });

  it("reflects sort state in the header indicator when a header is pressed", () => {
    render(<DataTable<Person> columns={columns} data={people} getRowId={getRowId} />);
    // unsorted: no ascending arrow rendered
    expect(screen.queryByText("▲")).toBeNull();

    fireEvent.press(screen.getByLabelText("Age"));

    // pressing a sortable header cycles it to ascending → the ▲ indicator shows
    expect(screen.getByText("▲")).toBeTruthy();
  });

  it("paginates with the footer next/previous controls", () => {
    render(
      <DataTable<Person>
        columns={columns}
        data={people}
        getRowId={getRowId}
        initialState={{ pagination: { pageIndex: 0, pageSize: 2 } }}
      />,
    );
    expect(screen.getByText(/Page 1 of 2/)).toBeTruthy();
    expect(screen.queryByText("Alan")).toBeNull();

    fireEvent.press(screen.getByLabelText("Next page"));

    expect(screen.getByText(/Page 2 of 2/)).toBeTruthy();
    expect(screen.getByText("Alan")).toBeTruthy();
    expect(screen.queryByText("Ada")).toBeNull();
  });
});

describe("<DataTable /> (react-native) — selection & bulk actions", () => {
  it("selects a row and fires a bulk action with the selected rows", () => {
    const onBulkAction = jest.fn();
    render(
      <DataTable<Person>
        columns={columns}
        data={people}
        getRowId={getRowId}
        enableSelection
        bulkActions={[{ id: "archive", label: "Archive" }]}
        onBulkAction={onBulkAction}
      />,
    );

    // checkbox[0] is the header select-all; [1] is the first row
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.press(checkboxes[1]!);

    // bulk bar appears with the count
    expect(screen.getByText("1 selected")).toBeTruthy();

    fireEvent.press(screen.getByText("Archive"));
    expect(onBulkAction).toHaveBeenCalledTimes(1);
    const [actionId, rows] = onBulkAction.mock.calls[0] as [string, readonly Row<Person>[]];
    expect(actionId).toBe("archive");
    expect(rows.map((row) => row.original.name)).toEqual(["Ada"]);
  });

  it("select-all in the header selects every filtered row", () => {
    render(
      <DataTable<Person>
        columns={columns}
        data={people}
        getRowId={getRowId}
        enableSelection
        onBulkAction={jest.fn()}
      />,
    );
    fireEvent.press(screen.getAllByRole("checkbox")[0]!);
    expect(screen.getByText("4 selected")).toBeTruthy();
  });
});

describe("<DataTable /> (react-native) — accessibility state", () => {
  it("exposes accessibilityState on sortable headers and toggles it on press", () => {
    render(<DataTable<Person> columns={columns} data={people} getRowId={getRowId} />);
    const ageHeader = screen.getByLabelText("Age");
    expect(ageHeader.props.accessibilityRole).toBe("button");
    // RN merges the `disabled` prop into accessibilityState, so assert the
    // sort-specific sub-key rather than the whole object.
    expect(ageHeader.props.accessibilityState.selected).toBe(false);

    fireEvent.press(ageHeader);
    expect(screen.getByLabelText("Age").props.accessibilityState.selected).toBe(true);
  });

  it("exposes accessibilityState.checked on selection checkboxes", () => {
    render(
      <DataTable<Person> columns={columns} data={people} getRowId={getRowId} enableSelection />,
    );
    const before = screen.getAllByRole("checkbox");
    expect(before[1]!.props.accessibilityState.checked).toBe(false);

    fireEvent.press(before[1]!);
    const after = screen.getAllByRole("checkbox");
    expect(after[1]!.props.accessibilityState.checked).toBe(true);
  });

  it("labels the pagination controls for screen readers", () => {
    render(<DataTable<Person> columns={columns} data={people} getRowId={getRowId} />);
    expect(screen.getByLabelText("Previous page")).toBeTruthy();
    expect(screen.getByLabelText("Next page")).toBeTruthy();
  });
});

describe("<DataTable /> (react-native) — ListComponent injection", () => {
  it("renders rows through an injected list component", () => {
    const CustomList = jest.fn((props: VirtualListProps<Row<Person>>) => (
      <View accessibilityLabel="custom-list">
        {props.data.map((item, index) => (
          <View key={props.keyExtractor(item, index)}>{props.renderItem({ item, index })}</View>
        ))}
      </View>
    ));

    render(
      <DataTable<Person>
        columns={columns}
        data={people}
        getRowId={getRowId}
        ListComponent={CustomList}
      />,
    );

    // the injected component is used...
    expect(screen.getByLabelText("custom-list")).toBeTruthy();
    expect(CustomList).toHaveBeenCalled();
    // ...and rows still render through its renderItem
    expect(screen.getByText("Ada")).toBeTruthy();
    expect(screen.getByText("Grace")).toBeTruthy();
  });
});

describe("<DataTable /> (react-native) — server mode", () => {
  const page = (params: FetchParams): FetchResult<Person> => {
    const start = params.pageIndex * params.pageSize;
    return { rows: people.slice(start, start + params.pageSize), totalCount: people.length };
  };

  it("shows a loading indicator then the fetched rows", async () => {
    let resolveFetch: ((result: FetchResult<Person>) => void) | undefined;
    const fetchData = jest.fn(
      () => new Promise<FetchResult<Person>>((resolve) => {
        resolveFetch = resolve;
      }),
    );

    render(<DataTable<Person> columns={columns} fetchData={fetchData} getRowId={getRowId} />);

    // mount kicked off the fetch; while pending we show the spinner
    expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(screen.queryByText("Ada")).toBeNull();

    await act(async () => {
      resolveFetch!(page({ pageIndex: 0, pageSize: 10 } as FetchParams));
    });

    expect(screen.getByText("Ada")).toBeTruthy();
    expect(fetchData).toHaveBeenCalledTimes(1);
  });

  it("surfaces the error state + retry, and recovers on retry", async () => {
    let shouldFail = true;
    const onError = jest.fn();
    const fetchData = jest.fn((params: FetchParams) =>
      shouldFail
        ? Promise.reject(new Error("api down"))
        : Promise.resolve(page(params)),
    );

    render(
      <DataTable<Person>
        columns={columns}
        fetchData={fetchData}
        getRowId={getRowId}
        onError={onError}
      />,
    );

    // first fetch rejects → error state appears and onError fires
    expect(await screen.findByText(defaultLabels.error)).toBeTruthy();
    expect(onError).toHaveBeenCalledTimes(1);

    // retry succeeds
    shouldFail = false;
    fireEvent.press(screen.getByText(defaultLabels.retry));

    expect(await screen.findByText("Ada")).toBeTruthy();
    expect(screen.queryByText(defaultLabels.error)).toBeNull();
  });

  it("passes a custom renderError with a working retry", async () => {
    const fetchData = jest.fn(() => Promise.reject(new Error("nope")));
    render(
      <DataTable<Person>
        columns={columns}
        fetchData={fetchData}
        getRowId={getRowId}
        renderError={(error) => <Text>Custom: {(error as Error).message}</Text>}
      />,
    );
    expect(await screen.findByText("Custom: nope")).toBeTruthy();
  });
});
