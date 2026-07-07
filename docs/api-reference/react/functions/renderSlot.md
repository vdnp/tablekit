# Function: renderSlot()

> **renderSlot**(`value`): `ReactNode`

Narrow core's `unknown` render-slot results to something React can render.
Objects that are not elements are dropped (with a dev warning) instead of
crashing the tree.

## Parameters

### value

`unknown`

## Returns

`ReactNode`
