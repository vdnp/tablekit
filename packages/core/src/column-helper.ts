import type { ColumnDef } from "./types";

export interface ColumnHelper<TData> {
  /** Typed accessor column: value type is inferred from the key. */
  accessor<TKey extends keyof TData & string>(
    key: TKey,
    def?: Omit<ColumnDef<TData, TData[TKey]>, "accessorKey" | "accessorFn">,
  ): ColumnDef<TData, TData[TKey]>;
  /** Computed column: value produced by a function over the row. */
  computed<TValue>(
    id: string,
    accessorFn: (row: TData, index: number) => TValue,
    def?: Omit<ColumnDef<TData, TValue>, "id" | "accessorKey" | "accessorFn">,
  ): ColumnDef<TData, TValue>;
  /** Display-only column (actions, checkboxes); not sortable/filterable by data. */
  display(def: ColumnDef<TData> & { id: string }): ColumnDef<TData>;
}

/**
 * Small factory that keeps column definitions fully typed against TData
 * without annotating every column by hand.
 */
export function createColumnHelper<TData>(): ColumnHelper<TData> {
  return {
    accessor(key, def) {
      return { ...def, accessorKey: key };
    },
    computed(id, accessorFn, def) {
      return { ...def, id, accessorFn };
    },
    display(def) {
      return def;
    },
  };
}
