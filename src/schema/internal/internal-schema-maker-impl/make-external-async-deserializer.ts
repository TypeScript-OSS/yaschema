import _ from 'lodash';

import { getAsyncMaxWorkIntervalMSec } from '../../../config/async-max-work-interval-msec';
import type { AsyncDeserializer } from '../../../types/deserializer';
import type { InternalAsyncValidator, InternalValidationOptions } from '../types/internal-validation';
import { sleep } from '../utils/sleep';

/** Makes the public async deserializer interface */
export const makeExternalAsyncDeserializer =
  <T>(validator: InternalAsyncValidator): AsyncDeserializer<T> =>
  async (value, { okToMutateInputValue = false, validation = 'hard' } = {}) => {
    const asyncMaxWorkIntervalMSec = getAsyncMaxWorkIntervalMSec();
    let lastYieldTimeMSec = performance.now();

    const modifiedPaths: Record<string, any> = {};
    const internalOptions: InternalValidationOptions = {
      transformation: 'deserialize',
      validation,
      inoutModifiedPaths: modifiedPaths,
      workingValue: okToMutateInputValue ? value : _.cloneDeep(value),
      shouldYield: () => performance.now() - lastYieldTimeMSec > asyncMaxWorkIntervalMSec,
      yield: () => {
        lastYieldTimeMSec = performance.now();
        return sleep(0);
      }
    };
    const output = await validator(internalOptions.workingValue, internalOptions, '');

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
