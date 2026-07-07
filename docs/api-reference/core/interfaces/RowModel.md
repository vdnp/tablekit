# Interface: RowModel\<TData\>

## Type Parameters

### TData

`TData`

## Properties

### flatRows

> **flatRows**: readonly [`Row`](Row.md)\<`TData`\>[]

Current page rows flattened in visual order, honoring `expanded`
(collapsed subtrees are omitted). This is what renderers iterate.

***

### rows

> **rows**: readonly [`Row`](Row.md)\<`TData`\>[]

Rows of the current page, as a tree (group rows contain subRows).
