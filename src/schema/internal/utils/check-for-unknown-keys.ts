import type { ValidationMode } from '../../../types/validation-options';
import type { InternalState } from '../internal-schema-maker-impl/internal-state';
import type { InternalValidationResult } from '../types/internal-validation';
import { isErrorResult } from './is-error-result';
import { makeErrorResultForValidationMode } from './make-error-result-for-validation-mode';

export const checkForUnknownKeys = <T>(
  validationResult: InternalValidationResult<T>,
  { internalState, failOnUnknownKeys, validation }: { internalState: InternalState; failOnUnknownKeys: boolean; validation: ValidationMode }
): InternalValidationResult<T> => {
  if (!isErrorResult(validationResult) && validation !== 'none' && failOnUnknownKeys) {
    const firstUnknownKeyPath = internalState.checkForUnknownKeys();
    if (firstUnknownKeyPath !== undefined) {
      return makeErrorResultForValidationMode(
        () => validationResult.value as T,
        validation,
        () => 'An unknown key was found',
        firstUnknownKeyPath
      );
    }
  }

  return validationResult;
};
