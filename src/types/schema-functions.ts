import type { AsyncCloner, SyncCloner } from './cloner.js';
import type { AsyncDeserializer, AsyncParser, SyncDeserializer, SyncParser } from './deserializer';
import type { Schema } from './schema';
import type { SchemaPreferredValidationMode } from './schema-preferred-validation';
import type { AsyncSerializer, AsyncStringifier, SyncSerializer, SyncStringifier } from './serializer';
import type { AsyncValidator, SyncValidator } from './validator';

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
   * - `"inherit"` - use the closet applicable mode from an ancestor schema level.
   */
  setPreferredValidationMode: (validationMode: SchemaPreferredValidationMode) => this;

  /** Makes a string representation of this schema, mostly for debugging */
  toString: () => string;

  /** Deeply clones a value */
  cloneValueAsync: AsyncCloner<ValueT>;

  /**
   * Deeply clones a value
   *
   * @throws if the schema requires async cloning
   */
  cloneValue: SyncCloner<ValueT>;

  /** Deserialize (and validate) a value */
  deserializeAsync: AsyncDeserializer<ValueT>;

  /**
   * Deserialize (and validate) a value
   *
   * @throws if the schema requires async deserialization
   */
  deserialize: SyncDeserializer<ValueT>;

  /**
   * Parse and deserialize a value from a JSON string
   *
   * @throws with a `DeserializationResult<T> & { error: string }` if parsing fails
   */
  parseAsync: AsyncParser<ValueT>;

  /**
   * Parse and deserialize a value from a JSON string
   *
   * @throws with a `DeserializationResult<T> & { error: string }` if parsing fails
   * @throws if the schema requires async deserialization
   */
  parse: SyncParser<ValueT>;

  /** Serialize (and validate) a value */
  serializeAsync: AsyncSerializer<ValueT>;

  /**
   * Serialize (and validate) a value
   *
   * @throws if the schema requires async serialization
   */
  serialize: SyncSerializer<ValueT>;

  /**
   * Serialize (and validate) and stringify a value
   *
   * @throws with a `SerializationResult<T> & { error: string }` if stringification fails
   */
  stringifyAsync: AsyncStringifier<ValueT>;

  /**
   * Serialize (and validate) and stringify a value
   *
   * @throws with a `SerializationResult<T> & { error: string }` if stringification fails
   * @throws if the schema requires async serialization
   */
  stringify: SyncStringifier<ValueT>;

  /** Validate a value */
  validateAsync: AsyncValidator;

  /** Validate a value.  This throws if the schema requires async validation. */
  validate: SyncValidator;
}
