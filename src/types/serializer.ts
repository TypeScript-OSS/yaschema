import type { JsonValue } from './json-value';
import type { StringifyOptions } from './stringify-options.js';
import type { TypeOrPromisedType } from './TypeOrPromisedType.js';
import type { ValidationErrorLevel } from './validation-error-level';
import type { ValidationOptions } from './validation-options';

/** If error is undefined, the result is a success.  Otherwise, there was a problem. */
export type SerializationResult =
  | { error?: undefined; errorPath?: string; errorLevel?: undefined; serialized: JsonValue }
  | { error: string; errorPath: string; errorLevel: ValidationErrorLevel; serialized?: JsonValue };

/** Serializes the specified value into JSON */
export type AsyncSerializer<T> = (value: T, options?: ValidationOptions) => TypeOrPromisedType<SerializationResult>;

/**
 * Serializes the specified value into JSON
 *
 * @throws if the schema requires async serialization
 */
export type SyncSerializer<T> = (value: T, options?: Omit<ValidationOptions, 'forceSync'>) => SerializationResult;

/**
 * Serialize and stringify the specified value into a JSON string
 *
 * @throws with a `SerializationResult<T> & { error: string }` if stringification fails
 */
export type AsyncStringifier<T> = (value: T, options?: StringifyOptions) => TypeOrPromisedType<string>;

/**
 * Serialize and stringify the specified value into a JSON string
 *
 * @throws with a `SerializationResult<T> & { error: string }` if stringification fails
 * @throws if the schema requires async serialization
 */
export type SyncStringifier<T> = (value: T, options?: Omit<StringifyOptions, 'forceSync'>) => string;
