# Function: devWarn()

> **devWarn**(`condition`, `message`): `void`

Development-only warning, deduplicated by message. Silent in production
builds (bundlers strip the branch via NODE_ENV).

## Parameters

### condition

`boolean`

### message

`string`

## Returns

`void`
