# Function: defaultFilterFn()

> **defaultFilterFn**(`value`, `filterValue`): `boolean`

Default column filter:
- empty filter (null/undefined/"" or empty array) matches everything
- string filter → case-insensitive substring match
- array filter → membership (Object.is or string-equal)
- anything else → Object.is equality

## Parameters

### value

`unknown`

### filterValue

`unknown`

## Returns

`boolean`
