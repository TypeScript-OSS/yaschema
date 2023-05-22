import type { AsyncValidator } from '../../../types/validator';
import type { InternalAsyncValidator } from '../types/internal-validation';
import { isMoreSevereResult } from '../utils/is-more-severe-result';
import { atPath, resolveLazyPath } from '../utils/path-utils';
import { InternalState } from './internal-state';

/** Makes the public async validator interface */
export const makeExternalAsyncValidator =
  (validator: InternalAsyncValidator): AsyncValidator =>
  async (value, { failOnUnknownKeys = false } = {}) => {
    const internalState = new InternalState(value, {
      transformation: 'none',
      operationValidation: 'hard',
      okToMutateInputValue: true, // Irrelevant since transformation is 'none'
      failOnUnknownKeys,
      removeUnknownKeys: false
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
        errorLevel: output.errorLevel
      };
    } else {
      return {};
    }
  };
