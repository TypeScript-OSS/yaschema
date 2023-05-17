import type { ValidationMode } from '../../../types/validation-options';
import type { InternalValidationResult } from '../types/internal-validation';
import type { LazyPath } from '../types/lazy-path';

export const makeErrorResultForValidationMode = (
  validationMode: ValidationMode,
  error: () => string,
  path: LazyPath
): InternalValidationResult => {
  if (validationMode === 'hard') {
    return { error, errorLevel: 'error', errorPath: path };
  } else {
    return { error, errorLevel: 'warning', errorPath: path };
  }
};
