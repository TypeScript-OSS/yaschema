import type { Schema } from '../../../types/schema';

/** Requires a non-null, non-undefined value. */
export interface AnySchema extends Schema {
  schemaType: 'any';
  clone: () => AnySchema;
}
