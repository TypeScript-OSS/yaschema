import type { Validator } from '../../../types/validator';
import type { InternalValidator } from '../types/internal-validation';
import { checkForUnknownKeys } from '../utils/check-for-unknown-keys';
import { atPath, resolveLazyPath } from '../utils/path-utils';
import { InternalState } from './internal-state';

/** Makes the public synchronous validator interface */
export const makeExternalValidator =
  (validator: InternalValidator): Validator =>
  (value, { failOnUnknownKeys = false } = {}) => {
    const internalState = new InternalState({
      transformation: 'none',
      operationValidation: 'hard',
      failOnUnknownKeys,
      removeUnknownKeys: true
    });

    const output = checkForUnknownKeys(
      validator(value, internalState, () => {}, {}, 'hard'),
      {
        internalState,
        failOnUnknownKeys,
        validation: 'hard'
      }
    );

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
