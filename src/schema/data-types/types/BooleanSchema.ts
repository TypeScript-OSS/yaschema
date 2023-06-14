import type { Schema } from '../../../types/schema';

/** Requires a boolean, optionally matching one of the specified values. */

export interface BooleanSchema<ValueT extends boolean> extends Schema<ValueT> {
  schemaType: 'boolean';
  clone: () => BooleanSchema<ValueT>;

  allowedValues: ValueT[];

  /**
   * For serialization, the first type will be used. `['boolean']` is assumed if nothing is specified.
   *
   * For deserialization, forms are tried in order.
   */
  allowedSerializationForms?: Array<'boolean' | 'string'>;
  /** Sets (replaces) the allowed serialization forms metadata for this schema and returns the same schema */
  setAllowedSerializationForms: (allowed?: Array<'boolean' | 'string'>) => this;
}
