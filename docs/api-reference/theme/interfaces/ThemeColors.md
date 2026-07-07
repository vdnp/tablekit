# Interface: ThemeColors

Platform-neutral design tokens. Web consumes them as CSS variables via
`themeToCssVariables`; React Native consumes the objects directly.
Colors meet WCAG AA contrast against their paired surfaces.

## Properties

### accent

> **accent**: `string`

Accent (sort indicators, focus rings, checkboxes, links).

***

### accentForeground

> **accentForeground**: `string`

Text rendered on top of accent.

***

### border

> **border**: `string`

Row/cell border lines.

***

### danger

> **danger**: `string`

Error text/background pair.

***

### dangerSurface

> **dangerSurface**: `string`

***

### surface

> **surface**: `string`

Table background.

***

### surfaceHover

> **surfaceHover**: `string`

Hovered/pressed row background.

***

### surfaceMuted

> **surfaceMuted**: `string`

Header row / group row background.

***

### surfaceSelected

> **surfaceSelected**: `string`

Selected row background.

***

### text

> **text**: `string`

Primary text.

***

### textMuted

> **textMuted**: `string`

Secondary text (header labels, captions).
