import type { Schema } from '../../../types/schema';
import type { AllowEmptyStringSchema } from './AllowEmptyStringSchema';

/** Requires a non-empty string, optionally matching one of the specified values. */

export interface StringSchema<ValueT extends string> extends Schema<ValueT> {
  schemaType: 'string';
  clone: () => StringSchema<ValueT>;

  allowedValues: ValueT[];
  allowEmptyString: () => AllowEmptyStringSchema<ValueT>;
}
