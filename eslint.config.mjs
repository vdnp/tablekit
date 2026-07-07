import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // *.cjs are CommonJS tooling configs (Jest/Babel) — not part of the typed
  // source graph; skip them so `module.exports` doesn't trip no-undef.
  { ignores: ["**/dist/**", "**/node_modules/**", "examples/**", "**/*.cjs"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
);
