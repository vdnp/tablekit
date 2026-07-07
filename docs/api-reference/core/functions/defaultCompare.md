# Function: defaultCompare()

> **defaultCompare**(`a`, `b`): `number`

Null-safe default comparator: numbers/dates/booleans/bigints compared
natively, everything else via locale-aware, numeric-friendly string
comparison. null/undefined (and NaN) always sort last regardless of
direction handling by the caller.

## Parameters

### a

`unknown`

### b

`unknown`

## Returns

`number`
