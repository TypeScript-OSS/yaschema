import type { AsyncDeserializer } from '../../../types/deserializer';
import type { InternalAsyncValidator } from '../types/internal-validation';
import { checkForUnknownKeys } from '../utils/check-for-unknown-keys';
import { isErrorResult } from '../utils/is-error-result';
import { atPath, resolveLazyPath } from '../utils/path-utils';
import { InternalState } from './internal-state';

/** Makes the public async deserializer interface */
export const makeExternalAsyncDeserializer =
  <T>(validator: InternalAsyncValidator): AsyncDeserializer<T> =>
  async (value, { failOnUnknownKeys = false, removeUnknownKeys = false, validation = 'hard' } = {}) => {
    const internalState = new InternalState({
      transformation: 'deserialize',
      operationValidation: validation,
      failOnUnknownKeys,
      removeUnknownKeys: failOnUnknownKeys || removeUnknownKeys
    });

    const output = checkForUnknownKeys(await validator(value, internalState, () => {}, {}, validation), {
      internalState,
      failOnUnknownKeys,
      validation
    });

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
