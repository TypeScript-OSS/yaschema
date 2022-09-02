import type { ValidationMode } from '../../../types/validation-options';
import type { InternalValidationOptions } from '../types/internal-validation';

export const getValidationMode = (internalOptions: InternalValidationOptions): ValidationMode => {
  if (internalOptions.operationValidation === 'none') {
    return 'none';
  }

  let numContainerTypesEncountered = 0;
  for (let index = internalOptions.schemaValidationPreferences.length - 1; index >= 0; index -= 1) {
    const preferences = internalOptions.schemaValidationPreferences[index];
    let mode = preferences.mode;
    const { depth, isContainerType } = preferences;

    if (mode === 'initial') {
      mode = internalOptions.operationValidation;
    }

    if (mode !== 'inherit') {
      if (depth === 'deep' || numContainerTypesEncountered < 1) {
        return minValidationMode(mode, internalOptions.operationValidation);
      }
    }

    if (isContainerType) {
      numContainerTypesEncountered += 1;
    }
  }

  return internalOptions.operationValidation;
};

// Helpers

const validationModeScores: Record<ValidationMode, number> = {
  none: 0,
  soft: 1,
  hard: 2
};

const minValidationMode = (a: ValidationMode, b: ValidationMode): ValidationMode =>
  validationModeScores[a] <= validationModeScores[b] ? a : b;
