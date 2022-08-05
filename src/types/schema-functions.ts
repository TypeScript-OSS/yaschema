import type { AsyncDeserializer, Deserializer } from './deserializer';
import type { Schema } from './schema';
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
  setDescription: (description: string) => this;
  /** Sets (replaces) the example metadata for this schema and returns the same schema */
  setExample: (example: string) => this;

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
