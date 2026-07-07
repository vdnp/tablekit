# Function: useDataTable()

> **useDataTable**\<`TData`\>(`options`): [`Table`](../interfaces/Table.md)\<`TData`\>

Headless entry point: owns a table instance across renders, keeps its
options fresh, and subscribes the component to state changes.

SSR-safe: the instance performs no side effects until mounted in an
effect, and `useSyncExternalStore` provides a server snapshot.

## Type Parameters

### TData

`TData`

## Parameters

### options

[`TableOptions`](../interfaces/TableOptions.md)\<`TData`\>

## Returns

[`Table`](../interfaces/Table.md)\<`TData`\>
