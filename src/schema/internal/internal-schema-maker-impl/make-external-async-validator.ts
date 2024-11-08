import { withResolved } from '../../../internal/utils/withResolved.js';
import type { AsyncValidator } from '../../../types/validator';
import type { InternalAsyncValidator } from '../types/internal-validation';
import { atPath, resolveLazyPath } from '../utils/path-utils.js';
import { InternalState } from './internal-state.js';

/** Makes the public async validator interface */
export const makeExternalAsyncValidator =
  (validator: InternalAsyncValidator): AsyncValidator =>
  (value, { forceSync = false, validation = 'hard' } = {}) => {
    const internalState = new InternalState({
      transformation: 'none',
      operationValidation: validation,
      asyncMaxWorkIntervalMSec: forceSync ? -1 : undefined
    });

    const validated = validator(value, internalState, () => {}, {}, 'hard');
    return withResolved(validated, (validated) => {
      if (validated.error !== undefined) {
        return {
          error: `${validated.error()}${atPath(validated.errorPath)}`,
          errorPath: resolveLazyPath(validated.errorPath).string,
          errorLevel: validated.errorLevel
        };
      } else {
        return {};
      }
    });
  };
