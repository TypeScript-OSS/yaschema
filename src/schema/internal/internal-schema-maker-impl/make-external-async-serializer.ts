import type { JsonValue } from '../../../types/json-value';
import type { AsyncSerializer } from '../../../types/serializer';
import type { InternalAsyncValidator } from '../types/internal-validation';
import { isMoreSevereResult } from '../utils/is-more-severe-result';
import { atPath, resolveLazyPath } from '../utils/path-utils';
import { InternalState } from './internal-state';

/** Makes the public async serializer interface */
export const makeExternalAsyncSerializer =
  <T>(validator: InternalAsyncValidator): AsyncSerializer<T> =>
  async (value, { okToMutateInputValue = false, failOnUnknownKeys = false, removeUnknownKeys = false, validation = 'hard' } = {}) => {
    const internalState = new InternalState(value, {
      transformation: 'serialize',
      operationValidation: validation,
      okToMutateInputValue,
      failOnUnknownKeys,
      removeUnknownKeys
    });

    let output = await validator(value, internalState, () => {});

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
        serialized: internalState.workingValue as JsonValue
      };
    } else {
      return { serialized: internalState.workingValue as JsonValue };
    }
  };
