import type { TypeOrPromisedType } from './TypeOrPromisedType.js';
import type { ValidationErrorLevel } from './validation-error-level';
import type { ValidationOptions } from './validation-options';

/** If error is undefined, the result is a success.  Otherwise, there was a problem.  The severity of the problem, if applicable, is
 * indicated by `errorLevel` */
export type DeserializationResult<T> =
  | { error?: undefined; errorPath?: undefined; errorLevel?: undefined; deserialized: T }
  | { error: string; errorPath: string; errorLevel: ValidationErrorLevel; deserialized?: T };

/** Deserializes the specified value from JSON */
export type AsyncDeserializer<T> = (value: any, options?: ValidationOptions) => TypeOrPromisedType<DeserializationResult<T>>;

/**
 * Deserializes the specified value from JSON.
 *
 * @throws if the schema requires async deserialization
 */
export type SyncDeserializer<T> = (value: any, options?: Omit<ValidationOptions, 'forceSync'>) => DeserializationResult<T>;

/**
 * Parse and deserialize a value from a JSON string
 *
 * @throws with a `DeserializationResult<T> & { error: string }` if parsing fails
 */
export type AsyncParser<T> = (jsonString: string, options?: ValidationOptions) => TypeOrPromisedType<T>;

/**
 * Parse and deserialize a value from a JSON string
 *
 * @throws with a `DeserializationResult<T> & { error: string }` if parsing fails
 * @throws if the schema requires async deserialization
 */
export type SyncParser<T> = (jsonString: string, options?: Omit<ValidationOptions, 'forceSync'>) => T;
