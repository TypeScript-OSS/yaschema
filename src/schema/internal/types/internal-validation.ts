import type { ValidationErrorLevel } from '../../../types/validation-error-level';
import type { ValidationMode } from '../../../types/validation-options';
import type { InternalState } from '../internal-schema-maker-impl/internal-state';
import type { GenericContainer } from './generic-container';
import type { LazyPath } from './lazy-path';

/**
 * - `'none'` - No transformation is performed (used for validation)
 * - `'serialize'` - The value is converted to JSON
 * - `'deserialize'` - The value is converted from JSON
 */
export type InternalTransformationType = 'none' | 'serialize' | 'deserialize';

/** Synchronously validates and potentially transforms the specified value */
export type InternalValidator = (
  value: any,
  internalState: InternalState,
  path: LazyPath,
  container: GenericContainer,
  validationMode: ValidationMode
) => InternalValidationResult;

/** Asynchronously validates and potentially transforms the specified value */
export type InternalAsyncValidator = (
  value: any,
  internalState: InternalState,
  path: LazyPath,
  container: GenericContainer,
  validationMode: ValidationMode
) => Promise<InternalValidationResult> | InternalValidationResult;

export interface InternalValidationErrorResult<ValueT = any> {
  invalidValue: () => ValueT;
  error: () => string;
  errorPath: LazyPath;
  errorLevel: ValidationErrorLevel;
}

export interface InternalValidationSuccessResult<ValueT = any> {
  value: ValueT;
  error?: undefined;
  errorPath?: undefined;
  errorLevel?: undefined;
}

export type InternalValidationResult<ValueT = any> = InternalValidationErrorResult<ValueT> | InternalValidationSuccessResult<ValueT>;
