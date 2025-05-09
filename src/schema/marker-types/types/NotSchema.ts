import type { Schema } from '../../../types/schema';

/** Requires the first specified schema but the second cannot be satisfied. */
export interface NotSchema<ValueT, ExcludedT> extends Schema<Exclude<ValueT, ExcludedT>> {
  schemaType: 'not';
  clone: () => NotSchema<ValueT, ExcludedT>;

  schema: Schema<ValueT>;
  notSchema: Schema<ExcludedT>;
  expectedTypeName?: string;
}
