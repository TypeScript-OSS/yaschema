import type { Schema } from '../../../types/schema';

/** Requires that either the specified schema is satisfied or that the value is `undefined`. */
export interface OptionalSchema<DefinedValueT> extends Schema<DefinedValueT | undefined> {
  schemaType: 'optional';
  clone: () => OptionalSchema<DefinedValueT>;

  schema: Schema<DefinedValueT>;
}
