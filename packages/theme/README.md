# @tablekit/theme

Design tokens for TableKit: colors, spacing, radii, typography — one source
of truth consumed by both renderers.

```ts
import { lightTheme, darkTheme, themeToCssVariables } from "@tablekit/theme";
import type { ThemeTokens } from "@tablekit/theme";
```

## Web

`@tablekit/react`'s stylesheet reads `--tk-*` CSS variables. Generate them
from tokens and put them on any ancestor:

```tsx
<div style={themeToCssVariables(darkTheme)}>
  <DataTable … />
</div>
```

Or override individual variables in plain CSS:

```css
.my-app {
  --tk-color-accent: #0ea5e9;
  --tk-radius-container: 4px;
}
```

## React Native

`@tablekit/react-native` takes the token object directly:

```tsx
const brand: ThemeTokens = {
  ...lightTheme,
  colors: { ...lightTheme.colors, accent: "#0ea5e9" },
};
<DataTable theme={brand} … />
```

Both built-in palettes meet WCAG AA contrast on their paired surfaces.

MIT © TableKit
