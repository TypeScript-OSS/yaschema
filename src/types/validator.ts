import type { TypeOrPromisedType } from './TypeOrPromisedType.js';
import type { ValidationErrorLevel } from './validation-error-level';
import type { ValidationOptions } from './validation-options.js';

/** If error is undefined, the result is a success.  Otherwise, there was a problem. */
export type ValidationResult =
  | { error: string; errorLevel: ValidationErrorLevel; errorPath: string }
  | { error?: undefined; errorLevel?: undefined; errorPath?: undefined };

/** Validates the specified value */
export type AsyncValidator = (value: any, options?: ValidationOptions) => TypeOrPromisedType<ValidationResult>;

/**
 * Validates the specified value
 *
 * @throws if the schema requires async validation
 */
export type SyncValidator = (value: any, options?: Omit<ValidationOptions, 'forceSync'>) => ValidationResult;
