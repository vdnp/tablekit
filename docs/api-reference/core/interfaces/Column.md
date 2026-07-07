# Interface: Column\<TData\>

Runtime column: the def plus state-aware helpers bound to the table.

## Type Parameters

### TData

`TData`

## Properties

### def

> **def**: [`ColumnDef`](ColumnDef.md)\<`TData`\>

***

### id

> **id**: `string`

## Methods

### getCanFilter()

> **getCanFilter**(): `boolean`

#### Returns

`boolean`

***

### getCanSort()

> **getCanSort**(): `boolean`

#### Returns

`boolean`

***

### getFilterValue()

> **getFilterValue**(): `unknown`

#### Returns

`unknown`

***

### getIsSorted()

> **getIsSorted**(): `false` \| [`SortDirection`](../type-aliases/SortDirection.md)

Current sort direction of this column, or `false` when unsorted.

#### Returns

`false` \| [`SortDirection`](../type-aliases/SortDirection.md)

***

### setFilterValue()

> **setFilterValue**(`value`): `void`

#### Parameters

##### value

`unknown`

#### Returns

`void`

***

### toggleSorting()

> **toggleSorting**(`desc?`, `additive?`): `void`

Cycle asc → desc → unsorted. `additive` appends for multi-sort.

#### Parameters

##### desc?

`boolean`

##### additive?

`boolean`

#### Returns

`void`
