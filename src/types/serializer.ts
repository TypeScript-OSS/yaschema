import type { JsonValue } from './json-value';
import type { TransformationOptions } from './transformation-options';
import type { ValidationErrorLevel } from './validation-error-level';
import type { ValidationOptions } from './validation-options';

/** If error is undefined, the result is a success.  Otherwise, there was a problem. */
export type SerializationResult =
  | { error?: undefined; errorPath?: string; errorLevel?: undefined; serialized: JsonValue }
  | { error: string; errorPath: string; errorLevel: ValidationErrorLevel; serialized?: JsonValue };

/** Synchronously serializes the specified value into JSON */
export type Serializer<T> = (value: T, options?: TransformationOptions & ValidationOptions) => SerializationResult;

/** Asynchronously serializes the specified value into JSON */
export type AsyncSerializer<T> = (value: T, options?: TransformationOptions & ValidationOptions) => Promise<SerializationResult>;
