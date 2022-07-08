import _ from 'lodash';

import type { JsonValue } from '../../../types/json-value';
import type { Serializer } from '../../../types/serializer';
import type { InternalValidationOptions, InternalValidator } from '../types/internal-validation';
import { sleep } from '../utils/sleep';

/** Makes the public synchronous serializer interface */
export const makeExternalSerializer = <ValueT>(validator: InternalValidator): Serializer<ValueT> => {
  return (value, { okToMutateInputValue = false, validation = 'hard' } = {}) => {
    const modifiedPaths: Record<string, any> = {};
    const internalOptions: InternalValidationOptions = {
      transformation: 'serialize',
      validation,
      inoutModifiedPaths: modifiedPaths,
      workingValue: okToMutateInputValue ? value : _.cloneDeep(value),
      shouldYield: () => false,
      yield: () => sleep(0)
    };
    const output = validator(internalOptions.workingValue, internalOptions, '');

    return {
      error: output.error?.(),
      serialized: internalOptions.workingValue as JsonValue
    };
  };
};
