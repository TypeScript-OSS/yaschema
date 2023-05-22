import type { ValidationErrorLevel } from './validation-error-level';
import type { ValidationOptions } from './validation-options';

/** If error is undefined, the result is a success.  Otherwise, there was a problem. */
export type ValidationResult =
  | { error: string; errorLevel: ValidationErrorLevel; errorPath: string }
  | { error?: undefined; errorLevel?: undefined; errorPath?: undefined };

/** Synchronously validates the specified value */
export type Validator = (value: any, options?: Omit<ValidationOptions, 'validation'>) => ValidationResult;

/** Asynchronously validates the specified value */
export type AsyncValidator = (value: any, options?: Omit<ValidationOptions, 'validation'>) => Promise<ValidationResult>;
