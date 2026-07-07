# Function: filterRows()

> **filterRows**\<`TData`\>(`rows`, `columnFilters`, `globalFilter`, `defsById`): [`Row`](../interfaces/Row.md)\<`TData`\>[]

Apply per-column filters, then the global search string.

## Type Parameters

### TData

`TData`

## Parameters

### rows

readonly [`Row`](../interfaces/Row.md)\<`TData`\>[]

### columnFilters

[`ColumnFiltersState`](../type-aliases/ColumnFiltersState.md)

### globalFilter

`string`

### defsById

`ReadonlyMap`\<`string`, [`ColumnDef`](../interfaces/ColumnDef.md)\<`TData`, `unknown`\>\>

## Returns

[`Row`](../interfaces/Row.md)\<`TData`\>[]
