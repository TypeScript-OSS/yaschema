import type { InternalValidationResult } from '../types/internal-validation';
import { isErrorResult } from './is-error-result';

export const isMoreSevereResult = (result: InternalValidationResult, thanResult: InternalValidationResult | undefined) => {
  if (isErrorResult(result)) {
    if (thanResult === undefined || !isErrorResult(thanResult)) {
      return true;
    }

    return result.errorLevel === 'error' && thanResult.errorLevel === 'warning';
  }

  return false;
};
