# Function: sortRows()

> **sortRows**\<`TData`\>(`rows`, `sorting`, `defsById`): [`Row`](../interfaces/Row.md)\<`TData`\>[]

Stable multi-column sort. Rows compare equal on all sort columns keep
their original data order.

## Type Parameters

### TData

`TData`

## Parameters

### rows

readonly [`Row`](../interfaces/Row.md)\<`TData`\>[]

### sorting

[`SortingState`](../type-aliases/SortingState.md)

### defsById

`ReadonlyMap`\<`string`, [`ColumnDef`](../interfaces/ColumnDef.md)\<`TData`, `unknown`\>\>

## Returns

[`Row`](../interfaces/Row.md)\<`TData`\>[]
