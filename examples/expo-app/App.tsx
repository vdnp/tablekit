import { DataTable, createColumnHelper } from "@vdnp/tablekit-react-native";
import type { Row, VirtualListComponent } from "@vdnp/tablekit-react-native";
import { FlashList } from "@shopify/flash-list";
import { useState } from "react";
import { SafeAreaView, StatusBar, Switch, Text, View } from "react-native";

interface Player {
  id: number;
  name: string;
  team: string;
  points: number;
}

const players: Player[] = Array.from({ length: 250 }, (_, index) => ({
  id: index + 1,
  name: `Player ${index + 1}`,
  team: ["Lions", "Eagles", "Sharks", "Wolves"][index % 4]!,
  points: ((index * 37) % 100) + 1,
}));

const helper = createColumnHelper<Player>();
const columns = [
  helper.accessor("name", { header: "Name", sortable: true, width: 140 }),
  helper.accessor("team", { header: "Team", sortable: true }),
  helper.accessor("points", { header: "Pts", sortable: true, align: "right", width: 70 }),
];

export default function App() {
  const [dark, setDark] = useState(false);
  const [selectable, setSelectable] = useState(true);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? "#020617" : "#f4f5f7" }}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
          <Text style={{ color: dark ? "#f1f5f9" : "#0f172a", fontWeight: "700", fontSize: 18 }}>
            TableKit RN demo
          </Text>
          <Switch value={dark} onValueChange={setDark} />
          <Switch value={selectable} onValueChange={setSelectable} />
        </View>
        <DataTable<Player>
          columns={columns}
          data={players}
          getRowId={(player) => String(player.id)}
          colorScheme={dark ? "dark" : "light"}
          enableSelection={selectable}
          showGlobalFilter
          initialState={{ pagination: { pageIndex: 0, pageSize: 25 } }}
          onRowPress={(row) => console.warn(`pressed ${row.original.name}`)}
          bulkActions={[{ id: "trade", label: "Trade" }]}
          onBulkAction={(action, rows) => console.warn(`${action}: ${rows.length} players`)}
          ListComponent={FlashList as unknown as VirtualListComponent<Row<Player>>}
        />
      </View>
    </SafeAreaView>
  );
}
