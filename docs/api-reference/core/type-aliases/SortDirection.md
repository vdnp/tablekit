# Type Alias: SortDirection

> **SortDirection** = `"asc"` \| `"desc"`

Public type surface of @tablekit/core.

Core is renderer-agnostic: render slots (`header`, `cell`) return `unknown`
and are narrowed to platform node types by the adapters. Render slots are
declared with method syntax on purpose — method positions are bivariant, so
a `ColumnDef<TData, number>` remains assignable to `ColumnDef<TData, unknown>`
without resorting to `any`.
