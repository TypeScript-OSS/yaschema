import type { Schema } from '../../../types/schema';

/** Requires an array. */

export interface ArraySchema<ItemT = any> extends Schema<ItemT[]> {
  schemaType: 'array';
  clone: () => ArraySchema<ItemT>;

  items?: Schema<ItemT>;
  minLength: number;
  maxLength: number;
  /**
   * If specified, only the first maxEntriesToValidate entries are validated -- applies to item validation but not pattern validation.
   * This is ignored if the items require custom serialization or deserialization
   */
  maxEntriesToValidate?: number;
}
