import type { Schema } from '../../../types/schema';

/** Requires a string, optionally matching one of the specified values. */
export interface AllowEmptyStringSchema<ValueT extends string> extends Schema<ValueT | ''> {
  readonly schemaType: 'allowEmptyString';
  readonly clone: () => AllowEmptyStringSchema<ValueT>;

  /** Note that this doesn't include `''` */
  readonly allowedValues: ValueT[];
}
