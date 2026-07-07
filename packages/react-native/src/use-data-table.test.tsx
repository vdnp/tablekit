import { describe, expect, it } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Pressable, Text, View } from "react-native";
import { useDataTable } from "./use-data-table";

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

/** Minimal headless consumer: proves hook state changes re-render the UI. */
function Harness({ pageSize }: { pageSize: number }) {
  const table = useDataTable<Person>({
    columns,
    data: people,
    getRowId: (person) => String(person.id),
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });
  const names = table.getRowModel().flatRows.map((row) => row.original.name).join(",");
  return (
    <View>
      <Pressable
        accessibilityLabel="sort-age-asc"
        onPress={() => table.setSorting([{ id: "age", desc: false }])}
      >
        <Text>sort</Text>
      </Pressable>
      <Pressable accessibilityLabel="next" onPress={() => table.nextPage()}>
        <Text>next</Text>
      </Pressable>
      <Text accessibilityLabel="names">{names}</Text>
      <Text accessibilityLabel="page">{String(table.getState().pagination.pageIndex)}</Text>
    </View>
  );
}

const namesText = () => String(screen.getByLabelText("names").props.children);
const pageText = () => String(screen.getByLabelText("page").props.children);

describe("useDataTable (react-native)", () => {
  it("reflects sorting state changes in the rendered rows", () => {
    render(<Harness pageSize={10} />);
    expect(namesText()).toBe("Ada,Grace,Alan,Linus");

    fireEvent.press(screen.getByLabelText("sort-age-asc"));

    // age asc: 28, 36, 41, 85
    expect(namesText()).toBe("Linus,Ada,Alan,Grace");
  });

  it("reflects pagination state changes in the rendered rows", () => {
    render(<Harness pageSize={2} />);
    expect(namesText()).toBe("Ada,Grace");
    expect(pageText()).toBe("0");

    fireEvent.press(screen.getByLabelText("next"));

    expect(namesText()).toBe("Alan,Linus");
    expect(pageText()).toBe("1");
  });
});
