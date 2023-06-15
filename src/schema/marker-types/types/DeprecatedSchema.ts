import type { Schema } from '../../../types/schema';

/** Requires either `undefined` or the specified schema to be satisfied. */

export interface DeprecatedSchema<ValueT> extends Schema<ValueT | undefined> {
  schemaType: 'deprecated';
  clone: () => DeprecatedSchema<ValueT>;

  schema: Schema<ValueT>;
  deadline?: string;
  uniqueName: string;
}
