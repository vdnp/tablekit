import type { ThemeTokens } from "./tokens";

/** All CSS custom properties understood by @tablekit/react's stylesheet. */
export type TableKitCssVariables = Record<`--tk-${string}`, string>;

/**
 * Convert a token object into the CSS variables consumed by the web
 * stylesheet. Apply the result to any ancestor of the table:
 *
 *   <div style={themeToCssVariables(darkTheme)}>…</div>
 */
export function themeToCssVariables(theme: ThemeTokens): TableKitCssVariables {
  const { colors, spacing, radius, typography } = theme;
  return {
    "--tk-color-surface": colors.surface,
    "--tk-color-surface-muted": colors.surfaceMuted,
    "--tk-color-surface-hover": colors.surfaceHover,
    "--tk-color-surface-selected": colors.surfaceSelected,
    "--tk-color-text": colors.text,
    "--tk-color-text-muted": colors.textMuted,
    "--tk-color-accent": colors.accent,
    "--tk-color-accent-foreground": colors.accentForeground,
    "--tk-color-border": colors.border,
    "--tk-color-danger": colors.danger,
    "--tk-color-danger-surface": colors.dangerSurface,
    "--tk-spacing-cell-x": `${spacing.cellX}px`,
    "--tk-spacing-cell-y": `${spacing.cellY}px`,
    "--tk-spacing-inline-gap": `${spacing.inlineGap}px`,
    "--tk-radius-container": `${radius.container}px`,
    "--tk-radius-control": `${radius.control}px`,
    "--tk-font-family": typography.fontFamily,
    "--tk-font-size": `${typography.fontSize}px`,
    "--tk-header-font-size": `${typography.headerFontSize}px`,
    "--tk-header-font-weight": String(typography.headerFontWeight),
    "--tk-line-height": String(typography.lineHeight),
  };
}
