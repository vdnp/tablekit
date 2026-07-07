# Interface: ColumnHelper\<TData\>

## Type Parameters

### TData

`TData`

## Methods

### accessor()

> **accessor**\<`TKey`\>(`key`, `def?`): [`ColumnDef`](ColumnDef.md)\<`TData`, `TData`\[`TKey`\]\>

Typed accessor column: value type is inferred from the key.

#### Type Parameters

##### TKey

`TKey` *extends* `string`

#### Parameters

##### key

`TKey`

##### def?

`Omit`\<[`ColumnDef`](ColumnDef.md)\<`TData`, `TData`\[`TKey`\]\>, `"accessorKey"` \| `"accessorFn"`\>

#### Returns

[`ColumnDef`](ColumnDef.md)\<`TData`, `TData`\[`TKey`\]\>

***

### computed()

> **computed**\<`TValue`\>(`id`, `accessorFn`, `def?`): [`ColumnDef`](ColumnDef.md)\<`TData`, `TValue`\>

Computed column: value produced by a function over the row.

#### Type Parameters

##### TValue

`TValue`

#### Parameters

##### id

`string`

##### accessorFn

(`row`, `index`) => `TValue`

##### def?

`Omit`\<[`ColumnDef`](ColumnDef.md)\<`TData`, `TValue`\>, `"accessorKey"` \| `"accessorFn"` \| `"id"`\>

#### Returns

[`ColumnDef`](ColumnDef.md)\<`TData`, `TValue`\>

***

### display()

> **display**(`def`): [`ColumnDef`](ColumnDef.md)\<`TData`\>

Display-only column (actions, checkboxes); not sortable/filterable by data.

#### Parameters

##### def

[`ColumnDef`](ColumnDef.md)\<`TData`, `unknown`\> & `object`

#### Returns

[`ColumnDef`](ColumnDef.md)\<`TData`\>
