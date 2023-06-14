import type { Validator } from '../../../types/validator';
import type { InternalValidator } from '../types/internal-validation';
import { atPath, resolveLazyPath } from '../utils/path-utils';
import { InternalState } from './internal-state';

/** Makes the public synchronous validator interface */
export const makeExternalValidator =
  (validator: InternalValidator): Validator =>
  (value) => {
    const internalState = new InternalState({
      transformation: 'none',
      operationValidation: 'hard'
    });

    const output = validator(value, internalState, () => {}, {}, 'hard');

    if (output.error !== undefined) {
      return {
        error: `${output.error()}${atPath(output.errorPath)}`,
        errorPath: resolveLazyPath(output.errorPath).string,
        errorLevel: output.errorLevel
      };
    } else {
      return {};
    }
  };
