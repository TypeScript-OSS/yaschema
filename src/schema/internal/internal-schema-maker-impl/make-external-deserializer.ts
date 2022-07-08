import _ from 'lodash';

import type { Deserializer } from '../../../types/deserializer';
import type { InternalValidationOptions, InternalValidator } from '../types/internal-validation';
import { sleep } from '../utils/sleep';

/** Makes the public synchronous deserializer interface */
export const makeExternalDeserializer =
  <T>(validator: InternalValidator): Deserializer<T> =>
  (value, { okToMutateInputValue = false, validation = 'hard' } = {}) => {
    const modifiedPaths: Record<string, any> = {};
    const internalOptions: InternalValidationOptions = {
      transformation: 'deserialize',
      validation,
      inoutModifiedPaths: modifiedPaths,
      workingValue: okToMutateInputValue ? value : _.cloneDeep(value),
      shouldYield: () => false,
      yield: () => sleep(0)
    };
    const output = validator(internalOptions.workingValue, internalOptions, '');

    // For deserialize, we update the object after validation
    for (const path of Object.keys(modifiedPaths)) {
      if (path === '') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        internalOptions.workingValue = modifiedPaths[path];
      } else {
        _.set(internalOptions.workingValue, path, modifiedPaths[path]);
      }
    }

    return {
      error: output.error?.(),
      deserialized: internalOptions.workingValue as T
    };
  };
