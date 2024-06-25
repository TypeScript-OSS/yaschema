import type { AsyncValidator } from '../../../types/validator';
import type { InternalAsyncValidator } from '../types/internal-validation';
import { atPath, resolveLazyPath } from '../utils/path-utils.js';
import { InternalState } from './internal-state.js';

/** Makes the public async validator interface */
export const makeExternalAsyncValidator =
  (validator: InternalAsyncValidator): AsyncValidator =>
  async (value) => {
    const internalState = new InternalState({
      transformation: 'none',
      operationValidation: 'hard'
    });

    const output = await validator(value, internalState, () => {}, {}, 'hard');

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
