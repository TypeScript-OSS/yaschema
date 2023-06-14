import type { JsonValue } from '../../../types/json-value';
import type { Serializer } from '../../../types/serializer';
import type { InternalValidator } from '../types/internal-validation';
import { isErrorResult } from '../utils/is-error-result';
import { atPath, resolveLazyPath } from '../utils/path-utils';
import { InternalState } from './internal-state';

/** Makes the public synchronous serializer interface */
export const makeExternalSerializer = <ValueT>(validator: InternalValidator): Serializer<ValueT> => {
  return (value, { validation = 'hard' } = {}) => {
    const internalState = new InternalState({
      transformation: 'serialize',
      operationValidation: validation
    });

    const output = validator(value, internalState, () => {}, {}, validation);

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
