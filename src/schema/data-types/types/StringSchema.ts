import type { Schema } from '../../../types/schema';
import type { AllowEmptyStringSchema } from './AllowEmptyStringSchema';

/** Requires a non-empty string, optionally matching one of the specified values. */
export interface StringSchema<ValueT extends string> extends Schema<ValueT> {
  schemaType: 'string';
  clone: () => StringSchema<ValueT>;

  allowedValues: ValueT[];
  allowEmptyString: () => AllowEmptyStringSchema<ValueT>;

  /**
   * `minLength` and `maxLength` are ignored when `allowedValues` is non-empty.
   *
   * @defaultValue `1` at time of construction.  Use `setAllowedLengthRange` to override.
   */
  minLength: number | undefined;
  maxLength: number | undefined;
  /** Sets (replaces) the `minLength` and `maxLength` fields for this schema and returns the same schema */
  setAllowedLengthRange: (minLength: number | undefined, maxLength: number | undefined) => this;
}
