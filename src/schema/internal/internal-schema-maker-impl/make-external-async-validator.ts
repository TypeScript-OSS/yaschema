import _ from 'lodash';

import { getAsyncMaxWorkIntervalMSec } from '../../../config/async-max-work-interval-msec';
import type { AsyncValidator } from '../../../types/validator';
import type { InternalAsyncValidator, InternalValidationOptions } from '../types/internal-validation';
import { atPath, resolveLazyPath } from '../utils/path-utils';
import { sleep } from '../utils/sleep';

/** Makes the public async validator interface */
export const makeExternalAsyncValidator =
  (validator: InternalAsyncValidator): AsyncValidator =>
  async (value) => {
    const asyncMaxWorkIntervalMSec = getAsyncMaxWorkIntervalMSec();
    let lastYieldTimeMSec = performance.now();

    const modifiedPaths = new Map<string, any>();
    const unknownKeysByPath: Partial<Record<string, Set<string> | 'allow-all'>> = {};
    const internalOptions: InternalValidationOptions = {
      transformation: 'none',
      operationValidation: 'hard',
      schemaValidationPreferences: [],
      shouldRemoveUnknownKeys: false,
      inoutModifiedPaths: modifiedPaths,
      inoutUnknownKeysByPath: unknownKeysByPath,
      workingValue: undefined,
      modifyWorkingValueAtPath: () => {
        // No-op
      },
      shouldRelax: () => performance.now() - lastYieldTimeMSec > asyncMaxWorkIntervalMSec,
      relax: () => {
        lastYieldTimeMSec = performance.now();
        return sleep(0);
      }
    };
    const output = await validator(value, internalOptions, '');

    if (output.error !== undefined) {
      return {
        error: `${output.error()}${atPath(output.errorPath)}`,
        errorPath: resolveLazyPath(output.errorPath),
        errorLevel: output.errorLevel
      };
    } else {
      return {};
    }
  };
