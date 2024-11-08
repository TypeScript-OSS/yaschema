import { withResolved } from '../../../internal/utils/withResolved.js';
import type { JsonValue } from '../../../types/json-value';
import type { AsyncSerializer } from '../../../types/serializer';
import type { InternalAsyncValidator } from '../types/internal-validation';
import { isErrorResult } from '../utils/is-error-result.js';
import { atPath, resolveLazyPath } from '../utils/path-utils.js';
import { InternalState } from './internal-state.js';

/** Makes the public async serializer interface */
export const makeExternalAsyncSerializer =
  <T>(validator: InternalAsyncValidator): AsyncSerializer<T> =>
  (value, { forceSync = false, validation = 'hard' } = {}) => {
    const internalState = new InternalState({
      transformation: 'serialize',
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
          serialized: validated.invalidValue() as JsonValue
        };
      } else {
        return { serialized: validated.value as JsonValue };
      }
    });
  };
