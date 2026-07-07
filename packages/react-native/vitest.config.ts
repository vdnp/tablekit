import { defineConfig } from "vitest/config";

// Full component tests need a Jest + react-native preset harness (RN ships
// untranspiled Flow source). Until then we unit-test the pure helpers here.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
