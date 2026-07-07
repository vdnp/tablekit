# Interface: ColumnDef\<TData, TValue\>

## Type Parameters

### TData

`TData`

### TValue

`TValue` = `unknown`

## Properties

### accessorKey?

> `optional` **accessorKey?**: keyof `TData` & `string`

Field to read from each row — compile-time constrained to keys of TData.

***

### align?

> `optional` **align?**: [`ColumnAlign`](../type-aliases/ColumnAlign.md)

***

### filterable?

> `optional` **filterable?**: `boolean`

Include this column in column/global filtering UI. Default: true for accessor columns.

***

### header?

> `optional` **header?**: `string` \| (() => `unknown`)

Static header label, or a render slot narrowed by the adapter.

***

### id?

> `optional` **id?**: `string`

Unique column id. Optional when `accessorKey` is provided (the key is
used as the id). Required for columns that only use `accessorFn`.

***

### maxWidth?

> `optional` **maxWidth?**: `number`

***

### meta?

> `optional` **meta?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Free-form escape hatch for adapter/user metadata.

***

### minWidth?

> `optional` **minWidth?**: `number`

***

### pinned?

> `optional` **pinned?**: [`ColumnPin`](../type-aliases/ColumnPin.md)

***

### resizable?

> `optional` **resizable?**: `boolean`

Allow the user to resize this column (web adapter). Default: false.

***

### sortable?

> `optional` **sortable?**: `boolean`

Enable click-to-sort UI for this column. Default: false.

***

### width?

> `optional` **width?**: `number`

## Methods

### accessorFn()?

> `optional` **accessorFn**(`row`, `index`): `TValue`

Derived value accessor. Takes precedence over `accessorKey`.

#### Parameters

##### row

`TData`

##### index

`number`

#### Returns

`TValue`

***

### cell()?

> `optional` **cell**(`context`): `unknown`

Custom cell render slot; adapters narrow the return type to their node type.

#### Parameters

##### context

[`CellContext`](CellContext.md)\<`TData`, `TValue`\>

#### Returns

`unknown`

***

### filterFn()?

> `optional` **filterFn**(`value`, `filterValue`, `row`): `boolean`

Custom filter predicate for this column.

#### Parameters

##### value

`unknown`

##### filterValue

`unknown`

##### row

[`Row`](Row.md)\<`TData`\>

#### Returns

`boolean`

***

### sortFn()?

> `optional` **sortFn**(`a`, `b`, `columnId`): `number`

Custom comparator. Return negative/zero/positive like Array.prototype.sort.

#### Parameters

##### a

[`Row`](Row.md)\<`TData`\>

##### b

[`Row`](Row.md)\<`TData`\>

##### columnId

`string`

#### Returns

`number`
