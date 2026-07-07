# Interface: DataTableProps\<TData\>

## Extends

- `Omit`\<[`TableOptions`](TableOptions.md)\<`TData`\>, `"columns"`\>

## Type Parameters

### TData

`TData`

## Properties

### autoResetPageIndex?

> `optional` **autoResetPageIndex?**: `boolean`

Reset to page 0 when sorting/filters change. Default: true.

#### Inherited from

[`TableOptions`](TableOptions.md).[`autoResetPageIndex`](TableOptions.md#autoresetpageındex)

***

### bulkActions?

> `optional` **bulkActions?**: readonly `object`[]

***

### colorScheme?

> `optional` **colorScheme?**: `"light"` \| `"dark"`

***

### columns?

> `optional` **columns?**: readonly [`ColumnDef`](ColumnDef.md)\<`TData`, `unknown`\>[]

Column definitions. Optional only when a prebuilt `table` is passed.

***

### data?

> `optional` **data?**: readonly `TData`[]

Client-side mode: the full data set. Mutually exclusive with `fetchData`.

#### Inherited from

`Omit.data`

***

### debugLabel?

> `optional` **debugLabel?**: `string`

Label used to prefix dev-mode warnings.

#### Inherited from

[`TableOptions`](TableOptions.md).[`debugLabel`](TableOptions.md#debuglabel)

***

### enableMultiSort?

> `optional` **enableMultiSort?**: `boolean`

Allow shift-click style multi-column sorting. Default: true.

#### Inherited from

[`TableOptions`](TableOptions.md).[`enableMultiSort`](TableOptions.md#enablemultisort)

***

### enableSelection?

> `optional` **enableSelection?**: `boolean`

***

### fetchData?

> `optional` **fetchData?**: [`FetchData`](../type-aliases/FetchData.md)\<`TData`\>

Server-side mode: async page fetcher. Mutually exclusive with `data`.

#### Inherited from

`Omit.fetchData`

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

#### Inherited from

`Omit.getRowId`

***

### initialState?

> `optional` **initialState?**: `Partial`\<[`TableState`](TableState.md)\>

Initial values for uncontrolled slices.

#### Inherited from

[`TableOptions`](TableOptions.md).[`initialState`](TableOptions.md#initialstate)

***

### labels?

> `optional` **labels?**: `Partial`\<\{ `empty`: `"No results."`; `error`: `"Something went wrong while loading data."`; `nextPage`: `"Next page"`; `pageInfo`: (`page`, `pageCount`, `total`) => `string`; `previousPage`: `"Previous page"`; `retry`: `"Retry"`; `search`: `"Search"`; `selectedCount`: (`count`) => `string`; \}\>

***

### ListComponent?

> `optional` **ListComponent?**: [`VirtualListComponent`](../type-aliases/VirtualListComponent.md)\<[`Row`](Row.md)\<`TData`\>\>

Virtualized list implementation. Defaults to FlatList; pass FlashList
from @shopify/flash-list for large data sets:
  ListComponent={FlashList as VirtualListComponent<Row<TData>>}

***

### minTableWidth?

> `optional` **minTableWidth?**: `number`

Minimum total width before the table scrolls horizontally.

***

### onBulkAction?

> `optional` **onBulkAction?**: (`actionId`, `rows`) => `void`

#### Parameters

##### actionId

`string`

##### rows

readonly [`Row`](Row.md)\<`TData`\>[]

#### Returns

`void`

***

### onColumnFiltersChange?

> `optional` **onColumnFiltersChange?**: (`filters`) => `void`

#### Parameters

##### filters

[`ColumnFiltersState`](../type-aliases/ColumnFiltersState.md)

#### Returns

`void`

#### Inherited from

`Omit.onColumnFiltersChange`

***

### onError?

> `optional` **onError?**: (`error`) => `void`

Called with any error thrown/rejected by `fetchData`.

#### Parameters

##### error

`unknown`

#### Returns

`void`

#### Inherited from

`Omit.onError`

***

### onExpandedChange?

> `optional` **onExpandedChange?**: (`expanded`) => `void`

#### Parameters

##### expanded

`ExpandedState`

#### Returns

`void`

#### Inherited from

`Omit.onExpandedChange`

***

### onGlobalFilterChange?

> `optional` **onGlobalFilterChange?**: (`globalFilter`) => `void`

#### Parameters

##### globalFilter

`string`

#### Returns

`void`

#### Inherited from

`Omit.onGlobalFilterChange`

***

### onGroupingChange?

> `optional` **onGroupingChange?**: (`grouping`) => `void`

#### Parameters

##### grouping

`GroupingState`

#### Returns

`void`

#### Inherited from

`Omit.onGroupingChange`

***

### onPaginationChange?

> `optional` **onPaginationChange?**: (`pagination`) => `void`

#### Parameters

##### pagination

[`PaginationState`](PaginationState.md)

#### Returns

`void`

#### Inherited from

`Omit.onPaginationChange`

***

### onRowLongPress?

> `optional` **onRowLongPress?**: (`row`) => `void`

Long-press handler — the natural RN idiom for row context actions.

#### Parameters

##### row

[`Row`](Row.md)\<`TData`\>

#### Returns

`void`

***

### onRowPress?

> `optional` **onRowPress?**: (`row`) => `void`

#### Parameters

##### row

[`Row`](Row.md)\<`TData`\>

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

#### Inherited from

`Omit.onRowSelectionChange`

***

### onSortingChange?

> `optional` **onSortingChange?**: (`sorting`) => `void`

#### Parameters

##### sorting

[`SortingState`](../type-aliases/SortingState.md)

#### Returns

`void`

#### Inherited from

`Omit.onSortingChange`

***

### renderEmpty?

> `optional` **renderEmpty?**: () => `ReactNode`

#### Returns

`ReactNode`

***

### renderError?

> `optional` **renderError?**: (`error`, `retry`) => `ReactNode`

#### Parameters

##### error

`unknown`

##### retry

() => `Promise`\<`void`\>

#### Returns

`ReactNode`

***

### renderExpandedRow?

> `optional` **renderExpandedRow?**: (`row`) => `ReactNode`

#### Parameters

##### row

[`Row`](Row.md)\<`TData`\>

#### Returns

`ReactNode`

***

### renderLoading?

> `optional` **renderLoading?**: () => `ReactNode`

#### Returns

`ReactNode`

***

### showGlobalFilter?

> `optional` **showGlobalFilter?**: `boolean`

***

### showPagination?

> `optional` **showPagination?**: `boolean`

***

### state?

> `optional` **state?**: `Partial`\<[`TableState`](TableState.md)\>

Controlled state slices. A slice present here is owned by the caller.

#### Inherited from

[`TableOptions`](TableOptions.md).[`state`](TableOptions.md#state)

***

### table?

> `optional` **table?**: [`Table`](Table.md)\<`TData`\>

Headless escape hatch: bring your own instance from useDataTable().

***

### theme?

> `optional` **theme?**: `ThemeTokens`
