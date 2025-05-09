import type { Schema } from '../../../types/schema';

/** References a schema dynamically, which is helpful with cyclical types */
export interface RefSchema<T> extends Schema<T> {
  schemaType: 'ref';
  clone: () => RefSchema<T>;

  getSchema: () => Schema<T>;
}
