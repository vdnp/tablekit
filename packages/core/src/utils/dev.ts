// Core targets lib ES2020 with no platform types; declare the two host
// globals it touches instead of pulling in DOM/Node type packages.
declare const process: { env?: { NODE_ENV?: string } } | undefined;
declare const console: { warn: (message: string) => void };

export function isDev(): boolean {
  try {
    return typeof process !== "undefined" && process?.env?.NODE_ENV !== "production";
  } catch {
    return false;
  }
}

const warned = new Set<string>();

/**
 * Development-only warning, deduplicated by message. Silent in production
 * builds (bundlers strip the branch via NODE_ENV).
 */
export function devWarn(condition: boolean, message: string): void {
  if (!isDev() || !condition || warned.has(message)) return;
  warned.add(message);
  console.warn(`[tablekit] ${message}`);
}

/** Test helper: reset warning dedupe between test cases. */
export function resetDevWarnings(): void {
  warned.clear();
}
