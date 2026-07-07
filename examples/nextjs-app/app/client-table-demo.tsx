"use client";

import { DataTable, createColumnHelper } from "@vdnp/tablekit-react";
import type { ColumnDef } from "@vdnp/tablekit-react";
import { darkTheme } from "@vdnp/tablekit-theme";
import { useMemo, useState } from "react";

interface Employee {
  id: number;
  name: string;
  department: "Engineering" | "Design" | "Sales";
  salary: number;
  startDate: string;
  active: boolean;
}

const employees: Employee[] = [
  { id: 1, name: "Aylin Demir", department: "Engineering", salary: 98000, startDate: "2021-03-15", active: true },
  { id: 2, name: "Mert Kaya", department: "Design", salary: 74000, startDate: "2022-07-01", active: true },
  { id: 3, name: "Zeynep Arslan", department: "Engineering", salary: 112000, startDate: "2019-11-20", active: true },
  { id: 4, name: "Can Yılmaz", department: "Sales", salary: 68000, startDate: "2023-01-09", active: false },
  { id: 5, name: "Elif Şahin", department: "Design", salary: 81000, startDate: "2020-05-30", active: true },
  { id: 6, name: "Burak Çelik", department: "Sales", salary: 71000, startDate: "2021-09-12", active: true },
  { id: 7, name: "Selin Koç", department: "Engineering", salary: 105000, startDate: "2018-02-05", active: false },
  { id: 8, name: "Emre Aydın", department: "Engineering", salary: 89000, startDate: "2022-10-17", active: true },
  { id: 9, name: "Deniz Öztürk", department: "Design", salary: 77000, startDate: "2023-04-03", active: true },
  { id: 10, name: "İrem Polat", department: "Sales", salary: 65000, startDate: "2024-06-24", active: true },
  { id: 11, name: "Kerem Ünal", department: "Engineering", salary: 94000, startDate: "2020-12-01", active: true },
  { id: 12, name: "Naz Erdoğan", department: "Design", salary: 83000, startDate: "2021-08-19", active: false },
];

const helper = createColumnHelper<Employee>();

export function ClientTableDemo() {
  const [dark, setDark] = useState(false);
  const [grouped, setGrouped] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const columns = useMemo<readonly ColumnDef<Employee>[]>(
    () => [
      helper.accessor("name", { header: "Name", sortable: true, width: 200, pinned: "left" }),
      helper.accessor("department", { header: "Department", sortable: true }),
      helper.accessor("salary", {
        header: "Salary",
        sortable: true,
        align: "right",
        cell: ({ value }) => `$${value.toLocaleString("en-US")}`,
      }),
      helper.accessor("startDate", { header: "Start date", sortable: true, resizable: true }),
      helper.accessor("active", {
        header: "Status",
        cell: ({ value }) => (
          <span style={{ color: value ? "#15803d" : "#b91c1c" }}>
            {value ? "Active" : "Inactive"}
          </span>
        ),
      }),
    ],
    [],
  );

  const pushLog = (entry: string) => setLog((current) => [entry, ...current].slice(0, 5));

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <label>
          <input type="checkbox" checked={dark} onChange={(event) => setDark(event.target.checked)} />{" "}
          Dark theme
        </label>
        <label>
          <input
            type="checkbox"
            checked={grouped}
            onChange={(event) => setGrouped(event.target.checked)}
          />{" "}
          Group by department
        </label>
      </div>

      <DataTable<Employee>
        columns={columns}
        data={employees}
        getRowId={(employee) => String(employee.id)}
        state={grouped ? { grouping: ["department"] } : { grouping: [] }}
        initialState={{ pagination: { pageIndex: 0, pageSize: 10 } }}
        enableSelection
        showGlobalFilter
        caption="Employee directory"
        theme={dark ? darkTheme : undefined}
        colorScheme={dark ? "dark" : "light"}
        bulkActions={[{ id: "export", label: "Export" }]}
        onBulkAction={(action, rows) => pushLog(`bulk:${action} → ${rows.length} rows`)}
        onRowClick={(row) => pushLog(`click → ${row.original.name}`)}
        onEdit={(row) => pushLog(`edit → ${row.original.name}`)}
        onDelete={(row) => pushLog(`delete → ${row.original.name}`)}
        pageSizeOptions={[5, 10, 20]}
      />

      {log.length > 0 ? (
        <pre style={{ fontSize: 12, color: "#64748b" }}>{log.join("\n")}</pre>
      ) : null}
    </div>
  );
}
