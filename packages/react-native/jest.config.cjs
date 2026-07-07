// Jest config for @tablekit/react-native only. This is the ONE package in the
// monorepo that uses Jest instead of Vitest: React Native ships untranspiled
// Flow source that Vitest's esbuild-based resolver cannot parse, so real
// component tests need the official react-native Jest preset + Babel. See
// CLAUDE.md → "Test strategy". Must be .cjs (package is "type": "module").

/** @type {import('jest').Config} */
module.exports = {
  // Official bare react-native preset (not jest-expo): this adapter is a pure
  // library that imports only from `react-native` core, so coupling its tests
  // to the Expo runtime would be wrong (and heavy). It sets up the RN module
  // resolver, Babel transform and the RN test globals.
  preset: "react-native",

  moduleNameMapper: {
    // Resolve workspace deps to their TypeScript source so the Jest tests don't
    // require a prior `tsup` build and don't depend on package "exports" wiring.
    "^@tablekit/core$": "<rootDir>/../core/src/index.ts",
    "^@tablekit/theme$": "<rootDir>/../theme/src/index.ts",
    // The pre-existing pure-helper test imports test globals from "vitest";
    // this package now runs Jest, so map "vitest" to a Jest-backed shim instead
    // of rewriting that test file. (Types still come from the real vitest pkg.)
    "^vitest$": "<rootDir>/test/jest-vitest-shim.ts",
  },

  transformIgnorePatterns: [
    // By default Jest skips transforming everything under node_modules, but
    // react-native / @react-native* ship untranspiled Flow + JSX that MUST be
    // Babel-transformed or you get "SyntaxError: Unexpected token" on Flow
    // syntax. The stock RN preset only un-ignores a TOP-LEVEL
    // node_modules/react-native/, which never matches under pnpm — pnpm nests
    // the real package at node_modules/.pnpm/<name>@<ver>/node_modules/<name>.
    // This pattern instead skips a node_modules path ONLY when the allow-listed
    // package names appear NOWHERE in it, so the pnpm-nested copies of
    // react-native, @react-native* and @testing-library/react-native are still
    // transformed. Delete this line and RN's own source fails to parse.
    "node_modules/(?!.*(?:react-native|@react-native|@react-native-community|@testing-library))",
  ],
};
