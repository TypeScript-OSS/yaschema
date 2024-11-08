import type { TypeOrPromisedType } from './TypeOrPromisedType.js';
import type { ValidationErrorLevel } from './validation-error-level';
import type { ValidationOptions } from './validation-options';

/** If error is undefined, the result is a success.  Otherwise, there was a problem.  The severity of the problem, if applicable, is
 * indicated by `errorLevel` */
export type DeserializationResult<T> =
  | { error?: undefined; errorPath?: undefined; errorLevel?: undefined; deserialized: T }
  | { error: string; errorPath: string; errorLevel: ValidationErrorLevel; deserialized?: T };

/** Asynchronously deserializes the specified value from JSON */
export type AsyncDeserializer<T> = (value: any, options?: ValidationOptions) => TypeOrPromisedType<DeserializationResult<T>>;
