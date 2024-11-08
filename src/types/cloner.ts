import type { TypeOrPromisedType } from './TypeOrPromisedType.js';
import type { ValidationErrorLevel } from './validation-error-level.js';
import type { ValidationOptions } from './validation-options.js';

/** If error is undefined, the result is a success.  Otherwise, there was a problem.  The severity of the problem, if applicable, is
 * indicated by `errorLevel` */
export type CloningResult<T> =
  | { error?: undefined; errorPath?: undefined; errorLevel?: undefined; cloned: T }
  | { error: string; errorPath: string; errorLevel: ValidationErrorLevel; cloned?: T };

/** Deeply clones the specified value */
export type AsyncCloner<T> = (value: T, options?: ValidationOptions) => TypeOrPromisedType<CloningResult<T>>;
