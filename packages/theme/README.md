# @tablekit/theme

The shared design-token source of truth for TableKit — colors, spacing, radii and
typography — consumed by both the web and native adapters. One place to restyle
every table.

- [Quick start](#quick-start)
- [Token reference](#token-reference)
- [Web usage](#web-usage)
- [React Native usage](#react-native-usage)
- [Light / dark switching](#light--dark-switching)
- [API reference](#api-reference)

## Quick start

```bash
npm i @tablekit/theme
```

```ts check
import { darkTheme, lightTheme, themeToCssVariables } from "@tablekit/theme";
import type { ThemeTokens } from "@tablekit/theme";

// Extend a built-in theme:
const brand: ThemeTokens = {
  ...lightTheme,
  colors: { ...lightTheme.colors, accent: "#0ea5e9" },
};

// Web: turn tokens into CSS variables
const cssVars = themeToCssVariables(brand);
// Native / core: pass the object straight through
console.log(darkTheme.colors.surface);
```

## Token reference

A `ThemeTokens` object has four groups.

### `colors: ThemeColors`

| Token | Role |
| --- | --- |
| `surface` | Table background |
| `surfaceMuted` | Header row / group row background |
| `surfaceHover` | Hovered / pressed row background |
| `surfaceSelected` | Selected row background |
| `text` | Primary text |
| `textMuted` | Secondary text (headers, captions) |
| `accent` | Sort indicators, focus rings, checkboxes, links |
| `accentForeground` | Text on top of `accent` |
| `border` | Row / cell border lines |
| `danger` | Error text |
| `dangerSurface` | Error background |

### `spacing`

| Token | Default | Role |
| --- | --- | --- |
| `cellX` | `12` | Cell horizontal padding |
| `cellY` | `10` | Cell vertical padding |
| `inlineGap` | `6` | Gap between inline elements (sort icon ↔ label) |

### `radius`

| Token | Default | Role |
| --- | --- | --- |
| `container` | `10` | Outer table container radius |
| `control` | `4` | Small controls (checkboxes, chips) |

### `typography`

| Token | Default | Role |
| --- | --- | --- |
| `fontFamily` | system sans-serif stack | Base font |
| `fontSize` | `14` | Body text size |
| `headerFontSize` | `13` | Header label size |
| `headerFontWeight` | `600` | Header label weight |
| `lineHeight` | `1.45` | Line height |

Spacing/radius/typography numbers are unitless; the web bridge appends `px` where
appropriate, React Native uses them directly. Both built-in palettes
(`lightTheme`, `darkTheme`) meet WCAG AA contrast on their paired surfaces.

## Web usage

`@tablekit/react`'s stylesheet reads `--tk-*` CSS variables.
`themeToCssVariables(tokens)` returns an object you can spread into `style` on any
ancestor of the table:

```tsx check
import { themeToCssVariables, darkTheme } from "@tablekit/theme";
import type { ReactNode } from "react";

export function ThemedRegion({ children }: { children: ReactNode }) {
  return <div style={themeToCssVariables(darkTheme)}>{children}</div>;
}
```

Or set individual variables in plain CSS — no JS needed:

```css
.my-app {
  --tk-color-accent: #0ea5e9;
  --tk-color-surface: #0b1220;
  --tk-radius-container: 4px;
}
```

## React Native usage

`@tablekit/react-native` takes the token object directly via the `theme` prop —
there is no CSS-variable step:

```ts check
import { lightTheme } from "@tablekit/theme";
import type { ThemeTokens } from "@tablekit/theme";

export const brand: ThemeTokens = {
  ...lightTheme,
  colors: { ...lightTheme.colors, accent: "#0ea5e9" },
  radius: { ...lightTheme.radius, container: 6 },
};
// <DataTable theme={brand} … />
```

## Light / dark switching

Drive the theme from your app's color-scheme state and pass the matching token
object (web can also just use `colorScheme="dark"` on `<DataTable />`):

```ts check
import { darkTheme, lightTheme } from "@tablekit/theme";

export function themeFor(scheme: "light" | "dark") {
  return scheme === "dark" ? darkTheme : lightTheme;
}
```

## API reference

Generated types: [docs/api-reference/theme](../../docs/api-reference/theme/README.md).

### Exports

| Export | Type | Description |
| --- | --- | --- |
| `lightTheme` | `ThemeTokens` | Default light palette + shared shape |
| `darkTheme` | `ThemeTokens` | Default dark palette + shared shape |
| `themeToCssVariables` | `(theme) => TableKitCssVariables` | Web: tokens → `--tk-*` CSS variables |
| `ThemeTokens` / `ThemeColors` | type | The token object shape |
| `TableKitCssVariables` | type | `Record<\`--tk-${string}\`, string>` |

MIT © TableKit
