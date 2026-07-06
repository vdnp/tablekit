import type { Updater } from "../types";

export function resolveUpdater<T>(updater: Updater<T>, previous: T): T {
  return typeof updater === "function" ? (updater as (previous: T) => T)(previous) : updater;
}
