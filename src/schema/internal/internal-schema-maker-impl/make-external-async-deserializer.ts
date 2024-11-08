import { withResolved } from '../../../internal/utils/withResolved.js';
import type { AsyncDeserializer } from '../../../types/deserializer';
import type { InternalAsyncValidator } from '../types/internal-validation';
import { isErrorResult } from '../utils/is-error-result.js';
import { atPath, resolveLazyPath } from '../utils/path-utils.js';
import { InternalState } from './internal-state.js';

/** Makes the public async deserializer interface */
export const makeExternalAsyncDeserializer =
  <T>(validator: InternalAsyncValidator): AsyncDeserializer<T> =>
  (value, { validation = 'hard' } = {}) => {
    const internalState = new InternalState({
      transformation: 'deserialize',
      operationValidation: validation
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
          deserialized: validated.invalidValue() as T
        };
      } else {
        return { deserialized: validated.value as T };
      }
    });
  };
