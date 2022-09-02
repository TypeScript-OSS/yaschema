import type { ValidationMode } from '../../../types/validation-options';
import type { InternalValidationResult } from '../types/internal-validation';

export const makeErrorResultForValidationMode = (
  validationMode: ValidationMode,
  error: () => string,
  path: string
): InternalValidationResult => {
  if (validationMode === 'hard') {
    return { error, errorLevel: 'error', errorPath: path };
  } else {
    return { error, errorLevel: 'warning', errorPath: path };
  }
};
