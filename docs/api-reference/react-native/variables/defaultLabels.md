# Variable: defaultLabels

> `const` **defaultLabels**: `object`

## Type Declaration

### empty

> `readonly` **empty**: `"No results."` = `"No results."`

### error

> `readonly` **error**: `"Something went wrong while loading data."` = `"Something went wrong while loading data."`

### nextPage

> `readonly` **nextPage**: `"Next page"` = `"Next page"`

### pageInfo

> `readonly` **pageInfo**: (`page`, `pageCount`, `total`) => `string`

#### Parameters

##### page

`number`

##### pageCount

`number`

##### total

`number`

#### Returns

`string`

### previousPage

> `readonly` **previousPage**: `"Previous page"` = `"Previous page"`

### retry

> `readonly` **retry**: `"Retry"` = `"Retry"`

### search

> `readonly` **search**: `"Search"` = `"Search"`

### selectedCount

> `readonly` **selectedCount**: (`count`) => `string`

#### Parameters

##### count

`number`

#### Returns

`string`
