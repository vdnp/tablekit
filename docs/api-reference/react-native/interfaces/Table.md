# Interface: Table\<TData\>

## Type Parameters

### TData

`TData`

## Properties

### isServerMode

> **isServerMode**: `boolean`

True when `fetchData` was provided.

## Methods

### getCanNextPage()

> **getCanNextPage**(): `boolean`

#### Returns

`boolean`

***

### getCanPreviousPage()

> **getCanPreviousPage**(): `boolean`

#### Returns

`boolean`

***

### getColumn()

> **getColumn**(`columnId`): [`Column`](Column.md)\<`TData`\> \| `undefined`

#### Parameters

##### columnId

`string`

#### Returns

[`Column`](Column.md)\<`TData`\> \| `undefined`

***

### getColumns()

> **getColumns**(): readonly [`Column`](Column.md)\<`TData`\>[]

#### Returns

readonly [`Column`](Column.md)\<`TData`\>[]

***

### getError()

> **getError**(): `unknown`

Server mode: last fetch error, cleared on the next successful fetch.

#### Returns

`unknown`

***

### getIsAllRowsSelected()

> **getIsAllRowsSelected**(): `boolean`

#### Returns

`boolean`

***

### getIsLoading()

> **getIsLoading**(): `boolean`

Server mode: a fetch is in flight. Always false in client mode.

#### Returns

`boolean`

***

### getIsSomeRowsSelected()

> **getIsSomeRowsSelected**(): `boolean`

#### Returns

`boolean`

***

### getPageCount()

> **getPageCount**(): `number`

#### Returns

`number`

***

### getPrePaginationRows()

> **getPrePaginationRows**(): readonly [`Row`](Row.md)\<`TData`\>[]

Rows after filter+sort+group but before pagination (client mode).

#### Returns

readonly [`Row`](Row.md)\<`TData`\>[]

***

### getRowModel()

> **getRowModel**(): `RowModel`\<`TData`\>

#### Returns

`RowModel`\<`TData`\>

***

### getSelectedRows()

> **getSelectedRows**(): readonly [`Row`](Row.md)\<`TData`\>[]

#### Returns

readonly [`Row`](Row.md)\<`TData`\>[]

***

### getState()

> **getState**(): [`TableState`](TableState.md)

Resolved state (controlled slices overlaid on internal state).

#### Returns

[`TableState`](TableState.md)

***

### getTotalCount()

> **getTotalCount**(): `number`

#### Returns

`number`

***

### getVersion()

> **getVersion**(): `number`

Monotonic version, bumped on every change — cheap snapshot for adapters.

#### Returns

`number`

***

### mount()

> **mount**(): () => `void`

Adapters call this once on the client (e.g. in useEffect) to start
fetching. Keeps createTable() side-effect free and SSR-safe.

#### Returns

() => `void`

***

### nextPage()

> **nextPage**(): `void`

#### Returns

`void`

***

### previousPage()

> **previousPage**(): `void`

#### Returns

`void`

***

### refetch()

> **refetch**(): `Promise`\<`void`\>

Server mode: re-run the fetcher with current params. No-op in client mode.

#### Returns

`Promise`\<`void`\>

***

### setColumnFilter()

> **setColumnFilter**(`columnId`, `value`): `void`

#### Parameters

##### columnId

`string`

##### value

`unknown`

#### Returns

`void`

***

### setColumnFilters()

> **setColumnFilters**(`updater`): `void`

#### Parameters

##### updater

`Updater`\<[`ColumnFiltersState`](../type-aliases/ColumnFiltersState.md)\>

#### Returns

`void`

***

### setExpanded()

> **setExpanded**(`updater`): `void`

#### Parameters

##### updater

`Updater`\<`Readonly`\<`Record`\<`string`, `boolean`\>\>\>

#### Returns

`void`

***

### setGlobalFilter()

> **setGlobalFilter**(`value`): `void`

#### Parameters

##### value

`string`

#### Returns

`void`

***

### setGrouping()

> **setGrouping**(`updater`): `void`

#### Parameters

##### updater

`Updater`\<`GroupingState`\>

#### Returns

`void`

***

### setOptions()

> **setOptions**(`options`): `void`

Adapters call this on re-render so new options/data/callbacks take effect.

#### Parameters

##### options

[`TableOptions`](TableOptions.md)\<`TData`\>

#### Returns

`void`

***

### setPageIndex()

> **setPageIndex**(`pageIndex`): `void`

#### Parameters

##### pageIndex

`number`

#### Returns

`void`

***

### setPageSize()

> **setPageSize**(`pageSize`): `void`

#### Parameters

##### pageSize

`number`

#### Returns

`void`

***

### setPagination()

> **setPagination**(`updater`): `void`

#### Parameters

##### updater

`Updater`\<[`PaginationState`](PaginationState.md)\>

#### Returns

`void`

***

### setRowSelection()

> **setRowSelection**(`updater`): `void`

#### Parameters

##### updater

`Updater`\<`Readonly`\<`Record`\<`string`, `boolean`\>\>\>

#### Returns

`void`

***

### setSorting()

> **setSorting**(`updater`): `void`

#### Parameters

##### updater

`Updater`\<[`SortingState`](../type-aliases/SortingState.md)\>

#### Returns

`void`

***

### setState()

> **setState**(`updater`): `void`

#### Parameters

##### updater

`Updater`\<[`TableState`](TableState.md)\>

#### Returns

`void`

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Subscribe to any state/data change. Returns an unsubscribe function.

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`

***

### toggleAllRowsSelected()

> **toggleAllRowsSelected**(`selected?`): `void`

Toggles all selectable rows currently passing filters (client) or on the page (server).

#### Parameters

##### selected?

`boolean`

#### Returns

`void`

***

### toggleRowExpanded()

> **toggleRowExpanded**(`rowId`, `expanded?`): `void`

#### Parameters

##### rowId

`string`

##### expanded?

`boolean`

#### Returns

`void`

***

### toggleRowSelected()

> **toggleRowSelected**(`rowId`, `selected?`): `void`

#### Parameters

##### rowId

`string`

##### selected?

`boolean`

#### Returns

`void`
