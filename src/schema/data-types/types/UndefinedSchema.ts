import type { Schema } from '../../../types/schema';

export interface UndefinedSchema extends Schema<undefined> {
  schemaType: 'undefined';
  clone: () => UndefinedSchema;
}
