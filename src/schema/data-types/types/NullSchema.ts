import type { Schema } from '../../../types/schema';

export interface NullSchema extends Schema<null> {
  schemaType: 'null';
  clone: () => NullSchema;
}
