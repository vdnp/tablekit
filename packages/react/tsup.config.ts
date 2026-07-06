import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  banner: {
    // Everything in this package is client-side; mark the Next.js boundary.
    js: '"use client";',
  },
});
