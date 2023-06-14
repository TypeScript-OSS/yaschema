import type { JsonValue } from '../../../types/json-value';
import type { Serializer } from '../../../types/serializer';
import type { InternalValidator } from '../types/internal-validation';
import { checkForUnknownKeys } from '../utils/check-for-unknown-keys';
import { isErrorResult } from '../utils/is-error-result';
import { atPath, resolveLazyPath } from '../utils/path-utils';
import { InternalState } from './internal-state';

/** Makes the public synchronous serializer interface */
export const makeExternalSerializer = <ValueT>(validator: InternalValidator): Serializer<ValueT> => {
  return (value, { failOnUnknownKeys = false, removeUnknownKeys = false, validation = 'hard' } = {}) => {
    const internalState = new InternalState({
      transformation: 'serialize',
      operationValidation: validation,
      failOnUnknownKeys,
      removeUnknownKeys: failOnUnknownKeys || removeUnknownKeys
    });

    const output = checkForUnknownKeys(
      validator(value, internalState, () => {}, {}, validation),
      {
        internalState,
        failOnUnknownKeys,
        validation
      }
    );

    if (isErrorResult(output)) {
      return {
        error: `${output.error()}${atPath(output.errorPath)}`,
        errorPath: resolveLazyPath(output.errorPath).string,
        errorLevel: output.errorLevel,
        serialized: output.invalidValue() as JsonValue
      };
    } else {
      return { serialized: output.value as JsonValue };
    }
  };
};
