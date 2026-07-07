# Function: themeToCssVariables()

> **themeToCssVariables**(`theme`): [`TableKitCssVariables`](../type-aliases/TableKitCssVariables.md)

Convert a token object into the CSS variables consumed by the web
stylesheet. Apply the result to any ancestor of the table:

  <div style={themeToCssVariables(darkTheme)}>…</div>

## Parameters

### theme

[`ThemeTokens`](../interfaces/ThemeTokens.md)

## Returns

[`TableKitCssVariables`](../type-aliases/TableKitCssVariables.md)
