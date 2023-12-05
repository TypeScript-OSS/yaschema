import type { Schema } from '../../../types/schema';

/** Requires a real, finite number, optionally matching one of the specified values. */
export interface NumberSchema<ValueT extends number> extends Schema<ValueT> {
  schemaType: 'number';
  clone: () => NumberSchema<ValueT>;

  allowedValues: ValueT[];

  /**
   * For serialization, the first type will be used. `['number']` is assumed if nothing is specified.
   *
   * For deserialization, forms are tried in order.
   */
  allowedSerializationForms?: Array<'number' | 'string'>;
  /** Sets (replaces) the allowed serialization forms metadata for this schema and returns the same schema */
  setAllowedSerializationForms: (allowed?: Array<'number' | 'string'>) => this;
}
