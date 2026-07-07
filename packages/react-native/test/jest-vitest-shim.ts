// Runtime shim so the pre-existing pure-helper test (src/helpers.test.ts) can
// keep importing its test globals from "vitest" while this package runs under
// Jest. jest.config.cjs maps `import … from "vitest"` to this module. The
// helper test only uses describe/it/expect, but we re-export the common set so
// the shim also covers future helper tests without edits. Type-checking still
// resolves "vitest" from the real package, so the source stays framework-honest.
import { afterEach, beforeEach, describe, expect, it, jest, test } from "@jest/globals";

export { afterEach, beforeEach, describe, expect, it, test };

// Vitest's `vi` ↔ Jest's `jest` — mock API is compatible for the calls we use.
export const vi = jest;
