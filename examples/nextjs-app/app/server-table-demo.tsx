"use client";

import { DataTable, createColumnHelper } from "@tablekit/react";
import type { FetchParams, FetchResult } from "@tablekit/react";
import { useCallback, useRef, useState } from "react";

interface Order {
  id: number;
  customer: string;
  total: number;
  status: "pending" | "shipped" | "delivered";
}

const customers = ["Acme", "Globex", "Initech", "Umbrella", "Stark", "Wayne", "Hooli", "Aperture"];
const statuses: Order["status"][] = ["pending", "shipped", "delivered"];

const allOrders: Order[] = Array.from({ length: 137 }, (_, index) => ({
  id: 1000 + index,
  customer: `${customers[index % customers.length]} #${index + 1}`,
  total: Math.round(((index * 7919) % 90000) + 1000) / 10,
  status: statuses[index % statuses.length]!,
}));

const helper = createColumnHelper<Order>();
const columns = [
  helper.accessor("id", { header: "Order", sortable: true, width: 110 }),
  helper.accessor("customer", { header: "Customer", sortable: true }),
  helper.accessor("total", {
    header: "Total",
    sortable: true,
    align: "right",
    // `value` is inferred as number from the accessor key — no casts needed.
    cell: ({ value }) => `$${value.toFixed(2)}`,
  }),
  helper.accessor("status", { header: "Status" }),
];

export function ServerTableDemo() {
  const [failNext, setFailNext] = useState(false);
  const failNextRef = useRef(failNext);
  failNextRef.current = failNext;

  // Simulated backend: sorts/filters/pages on "the server".
  const fetchData = useCallback(
    async (params: FetchParams): Promise<FetchResult<Order>> => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (failNextRef.current) {
        throw new Error("Simulated API failure");
      }
      let rows = [...allOrders];
      const query = params.globalFilter.trim().toLowerCase();
      if (query) {
        rows = rows.filter(
          (order) =>
            order.customer.toLowerCase().includes(query) ||
            String(order.id).includes(query) ||
            order.status.includes(query),
        );
      }
      const sort = params.sorting[0];
      if (sort) {
        const key = sort.id as keyof Order;
        rows.sort((a, b) => {
          const left = a[key];
          const right = b[key];
          const compared =
            typeof left === "number" && typeof right === "number"
              ? left - right
              : String(left).localeCompare(String(right));
          return sort.desc ? -compared : compared;
        });
      }
      const start = params.pageIndex * params.pageSize;
      return { rows: rows.slice(start, start + params.pageSize), totalCount: rows.length };
    },
    [],
  );

  return (
    <div>
      <label style={{ display: "inline-block", marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={failNext}
          onChange={(event) => setFailNext(event.target.checked)}
        />{" "}
        Fail the next request (then hit Retry)
      </label>

      <DataTable<Order>
        columns={columns}
        fetchData={fetchData}
        getRowId={(order) => String(order.id)}
        showGlobalFilter
        caption="Orders (server-side)"
        onError={(error) => console.error("[example] fetch failed:", error)}
        pageSizeOptions={[10, 25, 50]}
      />
    </div>
  );
}
