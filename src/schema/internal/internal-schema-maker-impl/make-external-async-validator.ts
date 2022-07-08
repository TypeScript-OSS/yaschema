import _ from 'lodash';

import { getAsyncMaxWorkIntervalMSec } from '../../../config/async-max-work-interval-msec';
import type { AsyncValidator } from '../../../types/validator';
import type { InternalAsyncValidator, InternalValidationOptions } from '../types/internal-validation';
import { sleep } from '../utils/sleep';

/** Makes the public async validator interface */
export const makeExternalAsyncValidator =
  (validator: InternalAsyncValidator): AsyncValidator =>
  async (value) => {
    const asyncMaxWorkIntervalMSec = getAsyncMaxWorkIntervalMSec();
    let lastYieldTimeMSec = performance.now();

    const modifiedPaths: Record<string, any> = {};
    const internalOptions: InternalValidationOptions = {
      transformation: 'none',
      validation: 'hard',
      inoutModifiedPaths: modifiedPaths,
      workingValue: undefined,
      shouldYield: () => performance.now() - lastYieldTimeMSec > asyncMaxWorkIntervalMSec,
      yield: () => {
        lastYieldTimeMSec = performance.now();
        return sleep(0);
      }
    };
    const output = await validator(value, internalOptions, '');

    return { error: output.error?.() };
  };
