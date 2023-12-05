import type { Schema } from '../../../types/schema';

/** Requires a non-null, non-array object where all keys share a schema and all values share a schema */
export interface RecordSchema<KeyT extends string, ValueT> extends Schema<Partial<Record<KeyT, ValueT>>> {
  readonly schemaType: 'record';
  readonly clone: () => RecordSchema<KeyT, ValueT>;

  readonly keys: RegExp | Schema<KeyT>;
  readonly valueSchema: Schema<ValueT>;

  /** If `true`, extra keys won't be removed.  This effects the directly described value but not sub-values. */
  allowUnknownKeys: boolean;
  readonly setAllowUnknownKeys: (allow: boolean) => this;
}
