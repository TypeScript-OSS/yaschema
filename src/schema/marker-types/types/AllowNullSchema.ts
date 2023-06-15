import type { Schema } from '../../../types/schema';

/** Requires that either the specified schema is satisfied or that the value is `null`. */

export interface AllowNullSchema<NonNullValueT> extends Schema<NonNullValueT | null> {
  schemaType: 'allowNull';
  clone: () => AllowNullSchema<NonNullValueT>;

  schema: Schema<NonNullValueT>;
}
