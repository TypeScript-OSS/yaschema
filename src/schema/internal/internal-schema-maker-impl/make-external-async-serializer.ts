import _ from 'lodash';

import { getAsyncMaxWorkIntervalMSec } from '../../../config/async-max-work-interval-msec';
import type { JsonValue } from '../../../types/json-value';
import type { AsyncSerializer } from '../../../types/serializer';
import type { InternalAsyncValidator, InternalValidationOptions } from '../types/internal-validation';
import { atPath } from '../utils/path-utils';
import { processRemoveUnknownKeys } from '../utils/process-remove-unknown-keys';
import { sleep } from '../utils/sleep';

/** Makes the public async serializer interface */
export const makeExternalAsyncSerializer =
  <T>(validator: InternalAsyncValidator): AsyncSerializer<T> =>
  async (value, { okToMutateInputValue = false, removeUnknownKeys = false, validation = 'hard' } = {}) => {
    const asyncMaxWorkIntervalMSec = getAsyncMaxWorkIntervalMSec();
    let lastYieldTimeMSec = performance.now();

    const modifiedPaths: Record<string, any> = {};
    const unknownKeysByPath: Partial<Record<string, Set<string> | 'allow-all'>> = {};
    const internalOptions: InternalValidationOptions = {
      transformation: 'serialize',
      operationValidation: validation,
      schemaValidationPreferences: [],
      shouldRemoveUnknownKeys: removeUnknownKeys,
      inoutModifiedPaths: modifiedPaths,
      inoutUnknownKeysByPath: unknownKeysByPath,
      workingValue: okToMutateInputValue ? value : _.cloneDeep(value),
      shouldYield: () => performance.now() - lastYieldTimeMSec > asyncMaxWorkIntervalMSec,
      yield: () => {
        lastYieldTimeMSec = performance.now();
        return sleep(0);
      }
    };
    const output = await validator(internalOptions.workingValue, internalOptions, '');

    if (removeUnknownKeys && (output.error === undefined || output.errorLevel !== 'error')) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      processRemoveUnknownKeys({ workingValue: internalOptions.workingValue, unknownKeysByPath });
    }

    if (output.error !== undefined) {
      return {
        error: `${output.error()}${atPath(output.errorPath)}`,
        errorPath: output.errorPath,
        errorLevel: output.errorLevel,
        serialized: internalOptions.workingValue as JsonValue
      };
    } else {
      return {
        serialized: internalOptions.workingValue as JsonValue
      };
    }
  };
