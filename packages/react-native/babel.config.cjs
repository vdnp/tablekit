// Babel config scoped to @vdnp/tablekit-react-native — used ONLY by Jest (via
// babel-jest). The package builds with tsup/esbuild, which ignores this file,
// so nothing here leaks into the published bundle or the rest of the monorepo.
// Must be .cjs because the package is "type": "module" (a plain .js here would
// be loaded as ESM and break Babel's module.exports contract).
module.exports = {
  presets: ["module:@react-native/babel-preset"],
};
