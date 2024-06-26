import type { Deserializer } from '../../../types/deserializer';
import type { InternalValidator } from '../types/internal-validation';
import { isErrorResult } from '../utils/is-error-result.js';
import { atPath, resolveLazyPath } from '../utils/path-utils.js';
import { InternalState } from './internal-state.js';

/** Makes the public synchronous deserializer interface */
export const makeExternalDeserializer =
  <T>(validator: InternalValidator): Deserializer<T> =>
  (value, { validation = 'hard' } = {}) => {
    const internalState = new InternalState({
      transformation: 'deserialize',
      operationValidation: validation
    });

    const output = validator(value, internalState, () => {}, {}, validation);

    if (!isErrorResult(output) || output.errorLevel !== 'error') {
      internalState.runDeferred();
    }

    if (isErrorResult(output)) {
      return {
        error: `${output.error()}${atPath(output.errorPath)}`,
        errorPath: resolveLazyPath(output.errorPath).string,
        errorLevel: output.errorLevel,
        deserialized: output.invalidValue() as T
      };
    } else {
      return { deserialized: output.value as T };
    }
  };
