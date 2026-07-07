# API reference

Auto-generated from the TypeScript source with
[TypeDoc](https://typedoc.org) + `typedoc-plugin-markdown`. Regenerate after
changing any public signature:

```bash
pnpm docs:api
```

> **Generated — do not edit by hand.** Files under `core/`, `react/`,
> `react-native/` and `theme/` are overwritten on each run. Edit the doc
> comments in `packages/*/src` instead, then regenerate.

## Packages

- [`@tablekit/core`](core/README.md) — headless engine, types, helpers
- [`@tablekit/react`](react/README.md) — web hook + `<DataTable />`
- [`@tablekit/react-native`](react-native/README.md) — native hook + `<DataTable />`
- [`@tablekit/theme`](theme/README.md) — design tokens

For prose, examples and guidance, start from the package READMEs
([core](../../packages/core/README.md) ·
[react](../../packages/react/README.md) ·
[react-native](../../packages/react-native/README.md) ·
[theme](../../packages/theme/README.md)) and the [guides](../guides).

## Supplementary notes (not captured by the generator)

TypeDoc renders each signature, but a few compile-time constraints and generic
relationships are worth stating explicitly:

- **`accessorKey` is key-constrained.** In `ColumnDef<TData>`, `accessorKey` has
  type `keyof TData & string` — a typo or non-existent field is a **compile
  error**, not a runtime surprise. For values that aren't real keys, use
  `createColumnHelper().computed(id, fn, …)`.
- **`cell` value inference flows from the column helper.** `helper.accessor("age",
  …)` produces `ColumnDef<TData, TData["age"]>`, so `cell: ({ value }) => …`
  receives a correctly typed `value`. Raw `ColumnDef` objects with only
  `accessorFn` fall back to `TValue = unknown`.
- **Render slots return `unknown` in core on purpose.** `header` and `cell` are
  declared with **method syntax** so a `ColumnDef<TData, number>` stays assignable
  to `ColumnDef<TData, unknown>` (method parameters are bivariant) without `any`.
  Adapters narrow the `unknown` result to their node type (`ReactNode`).
- **Controlled vs uncontrolled is per slice.** Any `TableState` slice passed via
  `options.state` is caller-owned; omit it and core owns it. This isn't visible in
  a single signature — see
  [core README → Controlled vs uncontrolled](../../packages/core/README.md#controlled-vs-uncontrolled-state).
- **`getError()` / `cell` value are `unknown`** by design — narrow with a type
  guard at the use site rather than casting.
