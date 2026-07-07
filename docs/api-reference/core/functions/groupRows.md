# Function: groupRows()

> **groupRows**\<`TData`\>(`rows`, `grouping`, `makeGroupRow`, `depth?`, `parentId?`): [`Row`](../interfaces/Row.md)\<`TData`\>[]

Recursively group rows by the given column ids (outermost first).
Group order follows first appearance in the (already sorted) input,
so sorting before grouping also orders the groups.

## Type Parameters

### TData

`TData`

## Parameters

### rows

readonly [`Row`](../interfaces/Row.md)\<`TData`\>[]

### grouping

[`GroupingState`](../type-aliases/GroupingState.md)

### makeGroupRow

`GroupRowFactory`\<`TData`\>

### depth?

`number` = `0`

### parentId?

`string` = `""`

## Returns

[`Row`](../interfaces/Row.md)\<`TData`\>[]
