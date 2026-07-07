# Interface: VirtualListProps\<TItem\>

Structural subset of FlatList/FlashList props we rely on — lets callers
inject @shopify/flash-list without this package depending on it.

## Type Parameters

### TItem

`TItem`

## Properties

### data

> **data**: readonly `TItem`[]

***

### extraData?

> `optional` **extraData?**: `unknown`

***

### keyExtractor

> **keyExtractor**: (`item`, `index`) => `string`

#### Parameters

##### item

`TItem`

##### index

`number`

#### Returns

`string`

***

### ListEmptyComponent?

> `optional` **ListEmptyComponent?**: `ReactElement`\<`any`, `string` \| `JSXElementConstructor`\<`any`\>\> \| `null`

***

### renderItem

> **renderItem**: (`info`) => `ReactElement`\<`any`, `string` \| `JSXElementConstructor`\<`any`\>\> \| `null`

#### Parameters

##### info

###### index

`number`

###### item

`TItem`

#### Returns

`ReactElement`\<`any`, `string` \| `JSXElementConstructor`\<`any`\>\> \| `null`
