import type { Schema } from '../../../types/schema';

/** Requires a string, optionally matching one of the specified values. */
export interface AllowEmptyStringSchema<ValueT extends string> extends Schema<ValueT | ''> {
  readonly schemaType: 'allowEmptyString';
  readonly clone: () => AllowEmptyStringSchema<ValueT>;

  /** Note that this doesn't include `''` */
  readonly allowedValues: ValueT[];

  /**
   * Empty strings are always allowed with `AllowEmptyStringSchema`.  `minLength` is only considered on non-empty strings.
   *
   * `minLength` and `maxLength` are ignored when `allowedValues` is non-empty.
   *
   * @defaultValue `1` at time of construction.  Use `setAllowedLengthRange` to override.
   */
  minLength: number | undefined;
  maxLength: number | undefined;
  /** Sets (replaces) the `minLength` and `maxLength` fields for this schema and returns the same schema */
  setAllowedLengthRange: (minLength: number | undefined, maxLength: number | undefined) => this;
}
