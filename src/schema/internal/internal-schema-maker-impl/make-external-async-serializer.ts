import _ from 'lodash';

import { getAsyncMaxWorkIntervalMSec } from '../../../config/async-max-work-interval-msec';
import type { JsonValue } from '../../../types/json-value';
import type { AsyncSerializer } from '../../../types/serializer';
import type { InternalAsyncValidator, InternalValidationOptions } from '../types/internal-validation';
import { sleep } from '../utils/sleep';

/** Makes the public async serializer interface */
export const makeExternalAsyncSerializer =
  <T>(validator: InternalAsyncValidator): AsyncSerializer<T> =>
  async (value, { okToMutateInputValue = false, validation = 'hard' } = {}) => {
    const asyncMaxWorkIntervalMSec = getAsyncMaxWorkIntervalMSec();
    let lastYieldTimeMSec = performance.now();

    const modifiedPaths: Record<string, any> = {};
    const internalOptions: InternalValidationOptions = {
      transformation: 'serialize',
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

    return {
      error: output.error?.(),
      serialized: internalOptions.workingValue as JsonValue
    };
  };
