# Interface: Row\<TData\>

## Type Parameters

### TData

`TData`

## Properties

### depth

> **depth**: `number`

Nesting depth: 0 for top-level rows.

***

### groupColumnId?

> `optional` **groupColumnId?**: `string`

For group rows: the column id that produced the group.

***

### groupValue?

> `optional` **groupValue?**: `unknown`

For group rows: the shared value of the group.

***

### id

> **id**: `string`

Stable id (from getRowId, defaults to stringified index).

***

### index

> **index**: `number`

Index within the original data array (or fetch page). -1 for group rows.

***

### isGroupRow

> **isGroupRow**: `boolean`

True when this row was synthesized by grouping.

***

### original

> **original**: `TData`

The user's original row object. `undefined` only for group rows.

***

### subRows

> **subRows**: readonly `Row`\<`TData`\>[]

## Methods

### getCanExpand()

> **getCanExpand**(): `boolean`

#### Returns

`boolean`

***

### getIsExpanded()

> **getIsExpanded**(): `boolean`

#### Returns

`boolean`

***

### getIsSelected()

> **getIsSelected**(): `boolean`

#### Returns

`boolean`

***

### getValue()

> **getValue**(`columnId`): `unknown`

Safe cell value access; returns undefined (never throws) for unknown columns.

#### Parameters

##### columnId

`string`

#### Returns

`unknown`

***

### toggleExpanded()

> **toggleExpanded**(`expanded?`): `void`

#### Parameters

##### expanded?

`boolean`

#### Returns

`void`

***

### toggleSelected()

> **toggleSelected**(`selected?`): `void`

#### Parameters

##### selected?

`boolean`

#### Returns

`void`
