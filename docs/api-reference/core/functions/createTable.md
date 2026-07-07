# Function: createTable()

> **createTable**\<`TData`\>(`initialOptions`): [`Table`](../interfaces/Table.md)\<`TData`\>

Create a headless table instance. Pure and side-effect free: no timers,
no fetches, no globals — safe to call during SSR. Server-mode fetching
starts only after `mount()` is invoked by the adapter.

## Type Parameters

### TData

`TData`

## Parameters

### initialOptions

[`TableOptions`](../interfaces/TableOptions.md)\<`TData`\>

## Returns

[`Table`](../interfaces/Table.md)\<`TData`\>
