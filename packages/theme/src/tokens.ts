/**
 * Platform-neutral design tokens. Web consumes them as CSS variables via
 * `themeToCssVariables`; React Native consumes the objects directly.
 * Colors meet WCAG AA contrast against their paired surfaces.
 */

export interface ThemeColors {
  /** Table background. */
  surface: string;
  /** Header row / group row background. */
  surfaceMuted: string;
  /** Hovered/pressed row background. */
  surfaceHover: string;
  /** Selected row background. */
  surfaceSelected: string;
  /** Primary text. */
  text: string;
  /** Secondary text (header labels, captions). */
  textMuted: string;
  /** Accent (sort indicators, focus rings, checkboxes, links). */
  accent: string;
  /** Text rendered on top of accent. */
  accentForeground: string;
  /** Row/cell border lines. */
  border: string;
  /** Error text/background pair. */
  danger: string;
  dangerSurface: string;
}

export interface ThemeTokens {
  colors: ThemeColors;
  spacing: {
    /** Cell horizontal padding. */
    cellX: number;
    /** Cell vertical padding. */
    cellY: number;
    /** Gap between inline elements (sort icon ↔ label). */
    inlineGap: number;
  };
  radius: {
    /** Outer table container radius. */
    container: number;
    /** Small controls (checkboxes, chips). */
    control: number;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    headerFontSize: number;
    headerFontWeight: number;
    lineHeight: number;
  };
}

const sharedShape = {
  spacing: { cellX: 12, cellY: 10, inlineGap: 6 },
  radius: { container: 10, control: 4 },
  typography: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    headerFontSize: 13,
    headerFontWeight: 600,
    lineHeight: 1.45,
  },
} satisfies Omit<ThemeTokens, "colors">;

export const lightTheme: ThemeTokens = {
  ...sharedShape,
  colors: {
    surface: "#ffffff",
    surfaceMuted: "#f8fafc",
    surfaceHover: "#f1f5f9",
    surfaceSelected: "#eef2ff",
    text: "#0f172a",
    textMuted: "#64748b",
    accent: "#4f46e5",
    accentForeground: "#ffffff",
    border: "#e2e8f0",
    danger: "#b91c1c",
    dangerSurface: "#fef2f2",
  },
};

export const darkTheme: ThemeTokens = {
  ...sharedShape,
  colors: {
    surface: "#0f172a",
    surfaceMuted: "#1e293b",
    surfaceHover: "#1e293b",
    surfaceSelected: "#312e81",
    text: "#f1f5f9",
    textMuted: "#94a3b8",
    accent: "#818cf8",
    accentForeground: "#0f172a",
    border: "#334155",
    danger: "#fca5a5",
    dangerSurface: "#450a0a",
  },
};
