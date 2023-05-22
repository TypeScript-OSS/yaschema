import type { Deserializer } from '../../../types/deserializer';
import type { InternalValidator } from '../types/internal-validation';
import { isMoreSevereResult } from '../utils/is-more-severe-result';
import { atPath, resolveLazyPath } from '../utils/path-utils';
import { InternalState } from './internal-state';

/** Makes the public synchronous deserializer interface */
export const makeExternalDeserializer =
  <T>(validator: InternalValidator): Deserializer<T> =>
  (value, { okToMutateInputValue = false, failOnUnknownKeys = false, removeUnknownKeys = false, validation = 'hard' } = {}) => {
    const internalState = new InternalState(value, {
      transformation: 'deserialize',
      operationValidation: validation,
      okToMutateInputValue,
      failOnUnknownKeys,
      removeUnknownKeys
    });

    let output = validator(value, internalState, () => {});

    if (output.error === undefined || output.errorLevel !== 'error') {
      internalState.applyWorkingValueModifications();
      const unknownKeysError = internalState.processUnknownKeysIfNeeded();
      if (isMoreSevereResult(unknownKeysError, output)) {
        output = unknownKeysError;
      }
    }

    if (output.error !== undefined) {
      return {
        error: `${output.error()}${atPath(output.errorPath)}`,
        errorPath: resolveLazyPath(output.errorPath).string,
        errorLevel: output.errorLevel,
        deserialized: internalState.workingValue as T
      };
    } else {
      return { deserialized: internalState.workingValue as T };
    }
  };
