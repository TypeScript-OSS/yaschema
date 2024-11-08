import type { SchemaPreferredValidationMode } from '../../../types/schema-preferred-validation';
import type { ValidationMode } from '../../../types/validation-options';

export const pickNextTopValidationMode = (
  preferredValidationMode: SchemaPreferredValidationMode,
  operationValidation: ValidationMode,
  validationMode: ValidationMode
) => {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (preferredValidationMode) {
    case 'inherit':
      return validationMode;

    case 'initial':
      return operationValidation;

    default:
      return preferredValidationMode;
  }
};
