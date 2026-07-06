import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// RTL's automatic cleanup needs injected globals; we keep globals off, so
// unmount explicitly between tests.
afterEach(() => cleanup());
