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

> `optional` **bulkActions?**: readonly [`BulkAction`](BulkAction.md)[]

Buttons shown in the bulk bar while rows are selected.

***

### caption?

> `optional` **caption?**: `string`

Accessible table caption (visually hidden).

***

### className?

> `optional` **className?**: `string`

***

### colorScheme?

> `optional` **colorScheme?**: `"light"` \| `"dark"`

Without a `theme`, picks the built-in light or dark variable set.

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

Render a leading checkbox column.

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

> `optional` **labels?**: `Partial`\<\{ `delete`: `"Delete"`; `edit`: `"Edit"`; `empty`: `"No results."`; `error`: `"Something went wrong while loading data."`; `expandRow`: `"Toggle row details"`; `loading`: `"Loading…"`; `nextPage`: `"Next page"`; `pageInfo`: (`page`, `pageCount`, `total`) => `string`; `previousPage`: `"Previous page"`; `retry`: `"Retry"`; `rowsPerPage`: `"Rows per page"`; `search`: `"Search"`; `selectAll`: `"Select all rows"`; `selectedCount`: (`count`) => `string`; `selectRow`: `"Select row"`; \}\>

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

### onDelete?

> `optional` **onDelete?**: (`row`) => `void`

When provided, an actions column with a Delete button is appended.

#### Parameters

##### row

[`Row`](Row.md)\<`TData`\>

#### Returns

`void`

***

### onEdit?

> `optional` **onEdit?**: (`row`) => `void`

When provided, an actions column with an Edit button is appended.

#### Parameters

##### row

[`Row`](Row.md)\<`TData`\>

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

### onRowClick?

> `optional` **onRowClick?**: (`row`) => `void`

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

### pageSizeOptions?

> `optional` **pageSizeOptions?**: readonly `number`[]

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

When provided, rows get an expander and this renders the detail panel.

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

Render the global search input above the table. Default: false.

***

### showPagination?

> `optional` **showPagination?**: `boolean`

Render the pagination footer. Default: true.

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

Token object applied as CSS variables on the root element.
