import { withResolved } from '../../../internal/utils/withResolved.js';
import type { AsyncCloner } from '../../../types/cloner.js';
import type { InternalAsyncValidator } from '../types/internal-validation.js';
import { isErrorResult } from '../utils/is-error-result.js';
import { atPath, resolveLazyPath } from '../utils/path-utils.js';
import { InternalState } from './internal-state.js';

/** Makes the public async clone interface */
export const makeExternalAsyncCloner =
  <T>(validator: InternalAsyncValidator): AsyncCloner<T> =>
  (value, { forceSync = false, validation = 'hard' } = {}) => {
    const internalState = new InternalState({
      transformation: 'clone',
      operationValidation: validation,
      asyncMaxWorkIntervalMSec: forceSync ? -1 : undefined
    });

    const validated = validator(value, internalState, () => {}, {}, validation);
    return withResolved(validated, (validated) => {
      if (!isErrorResult(validated) || validated.errorLevel !== 'error') {
        internalState.runDeferred();
      }

      if (isErrorResult(validated)) {
        return {
          error: `${validated.error()}${atPath(validated.errorPath)}`,
          errorPath: resolveLazyPath(validated.errorPath).string,
          errorLevel: validated.errorLevel,
          cloned: validated.invalidValue() as T
        };
      } else {
        return { cloned: validated.value as T };
      }
    });
  };
