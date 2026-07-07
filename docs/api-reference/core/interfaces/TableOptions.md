# Interface: TableOptions\<TData\>

## Type Parameters

### TData

`TData`

## Properties

### autoResetPageIndex?

> `optional` **autoResetPageIndex?**: `boolean`

Reset to page 0 when sorting/filters change. Default: true.

***

### columns

> **columns**: readonly [`ColumnDef`](ColumnDef.md)\<`TData`, `unknown`\>[]

***

### data?

> `optional` **data?**: readonly `TData`[]

Client-side mode: the full data set. Mutually exclusive with `fetchData`.

***

### debugLabel?

> `optional` **debugLabel?**: `string`

Label used to prefix dev-mode warnings.

***

### enableMultiSort?

> `optional` **enableMultiSort?**: `boolean`

Allow shift-click style multi-column sorting. Default: true.

***

### fetchData?

> `optional` **fetchData?**: [`FetchData`](../type-aliases/FetchData.md)\<`TData`\>

Server-side mode: async page fetcher. Mutually exclusive with `data`.

***

### getRowId?

> `optional` **getRowId?**: (`row`, `index`) => `string`

Stable row identity. Strongly recommended for selection/expansion.

#### Parameters

##### row

`TData`

##### index

`number`

#### Returns

`string`

***

### initialState?

> `optional` **initialState?**: `Partial`\<[`TableState`](TableState.md)\>

Initial values for uncontrolled slices.

***

### onColumnFiltersChange?

> `optional` **onColumnFiltersChange?**: (`filters`) => `void`

#### Parameters

##### filters

[`ColumnFiltersState`](../type-aliases/ColumnFiltersState.md)

#### Returns

`void`

***

### onError?

> `optional` **onError?**: (`error`) => `void`

Called with any error thrown/rejected by `fetchData`.

#### Parameters

##### error

`unknown`

#### Returns

`void`

***

### onExpandedChange?

> `optional` **onExpandedChange?**: (`expanded`) => `void`

#### Parameters

##### expanded

[`ExpandedState`](../type-aliases/ExpandedState.md)

#### Returns

`void`

***

### onGlobalFilterChange?

> `optional` **onGlobalFilterChange?**: (`globalFilter`) => `void`

#### Parameters

##### globalFilter

`string`

#### Returns

`void`

***

### onGroupingChange?

> `optional` **onGroupingChange?**: (`grouping`) => `void`

#### Parameters

##### grouping

[`GroupingState`](../type-aliases/GroupingState.md)

#### Returns

`void`

***

### onPaginationChange?

> `optional` **onPaginationChange?**: (`pagination`) => `void`

#### Parameters

##### pagination

[`PaginationState`](PaginationState.md)

#### Returns

`void`

***

### onRowSelectionChange?

> `optional` **onRowSelectionChange?**: (`selection`) => `void`

#### Parameters

##### selection

[`RowSelectionState`](../type-aliases/RowSelectionState.md)

#### Returns

`void`

***

### onSortingChange?

> `optional` **onSortingChange?**: (`sorting`) => `void`

#### Parameters

##### sorting

[`SortingState`](../type-aliases/SortingState.md)

#### Returns

`void`

***

### state?

> `optional` **state?**: `Partial`\<[`TableState`](TableState.md)\>

Controlled state slices. A slice present here is owned by the caller.
