import type { TransformationOptions } from './transformation-options';
import type { ValidationErrorLevel } from './validation-error-level';
import type { ValidationOptions } from './validation-options';

/** If error is undefined, the result is a success.  Otherwise, there was a problem.  The severity of the problem, if applicable, is
 * indicated by `errorLevel` */
export type DeserializationResult<T> =
  | { error?: undefined; errorPath?: undefined; errorLevel?: undefined; deserialized: T }
  | { error: string; errorPath: string; errorLevel: ValidationErrorLevel; deserialized?: T };

/** Synchronously deserializes the specified value from JSON */
export type Deserializer<T> = (value: any, options?: TransformationOptions & ValidationOptions) => DeserializationResult<T>;

/** Asynchronously deserializes the specified value from JSON */
export type AsyncDeserializer<T> = (value: any, options?: TransformationOptions & ValidationOptions) => Promise<DeserializationResult<T>>;
