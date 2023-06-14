import type { ValidationMode } from '../../../types/validation-options';
import type { InternalValidationErrorResult } from '../types/internal-validation';
import type { LazyPath } from '../types/lazy-path';

export const makeErrorResultForValidationMode = <ValueT>(
  value: () => ValueT,
  validationMode: ValidationMode,
  error: () => string,
  path: LazyPath
): InternalValidationErrorResult => ({
  invalidValue: value,
  error,
  errorLevel: validationMode === 'hard' ? 'error' : 'warning',
  errorPath: path
});
