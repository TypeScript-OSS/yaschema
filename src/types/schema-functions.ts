import type { AsyncDeserializer, Deserializer } from './deserializer';
import type { Schema } from './schema';
import type { SchemaPreferredValidationMode, SchemaPreferredValidationModeDepth } from './schema-preferred-validation';
import type { AsyncSerializer, Serializer } from './serializer';
import type { AsyncValidator, Validator } from './validator';

export interface SchemaFunctions<ValueT> {
  /** Returns a new schema that requires that either this schema is satisfied or that the value is `null`. */
  allowNull: () => Schema<ValueT | null>;
  /** Returns a new schema that requires that this schema is satisfied but that the specified schema cannot be satisfied. */
  not: <ExcludeT>(notSchema: Schema<ExcludeT>, options?: { expectedTypeName?: string }) => Schema<Exclude<ValueT, ExcludeT>>;
  /** Returns a new schema that requires that either this schema is satisfied or that the value is `undefined`. */
  optional: () => Schema<ValueT | undefined>;

  /** Sets (replaces) the description metadata for this schema and returns the same schema */
  setDescription: (description?: string) => this;
  /** Sets (replaces) the example metadata for this schema and returns the same schema */
  setExample: (example?: string) => this;
  /** Sets (replaces) the `disableRemoveUnknownKeys` option */
  setDisableRemoveUnknownKeys: (disable: boolean) => this;
  /**
   * Sets (replaces) the preferred validation mode for this schema and returns the same schema.
   *
   * The lesser level of the preferred validation mode, which will be applied recursively depending on the `depth` parameter / unless
   * further re-specified, and the specified validation mode, will be used, where the order is `none < soft < hard`.
   *
   * @param validationMode - The preferred validation mode for this schema
   * Special Values:
   * - `"initial"` - use the initially specified validation mode for the current operation (ex. the `validation` field of the `options`
   * parameter to `deserialize`).
   * - `"inherit"` - (default) use the closet applicable mode from an ancestor schema level.
   * @param depth - The depth to apply schema-level validation preferences over
   * - `"shallow"` - (default) The mode change only affects the validation of the value directly described by this schema.  For container
   * types, this includes the first level of fields but not deeper.
   * - `"deep"` - The mode change affects all values directly and indirectly described by this schema, unless the validation mode is
   * re-specified at a deeper level.
   */
  setPreferredValidationMode: (validationMode?: SchemaPreferredValidationMode, depth?: SchemaPreferredValidationModeDepth) => this;

  /** Makes a string representation of this schema, mostly for debugging */
  toString: () => string;

  /** Synchronously deserialize (and validate) a value */
  deserialize: Deserializer<ValueT>;
  /** Asynchronously deserialize (and validate) a value */
  deserializeAsync: AsyncDeserializer<ValueT>;

  /** Synchronously serialize (and validate) a value */
  serialize: Serializer<ValueT>;
  /** Asynchronously serialize (and validate) a value */
  serializeAsync: AsyncSerializer<ValueT>;

  /** Synchronously validate a value */
  validate: Validator;
  /** Asynchronously validate a value */
  validateAsync: AsyncValidator;
}
