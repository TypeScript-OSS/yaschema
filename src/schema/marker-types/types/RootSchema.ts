import type { Schema } from '../../../types/schema';

/** A special marker schema for named types, useful for code generation tools.  Roots are not cloneable. */

export interface RootSchema<ValueT> extends Schema<ValueT> {
  schemaType: 'root';
  name: string;
  schema: Schema<ValueT>;
}
