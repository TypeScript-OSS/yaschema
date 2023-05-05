import _ from 'lodash';

import { getAsyncMaxWorkIntervalMSec } from '../../../config/async-max-work-interval-msec';
import type { AsyncDeserializer } from '../../../types/deserializer';
import type { InternalAsyncValidator, InternalValidationOptions } from '../types/internal-validation';
import { atPath } from '../utils/path-utils';
import { processRemoveUnknownKeys } from '../utils/process-remove-unknown-keys';
import { sleep } from '../utils/sleep';

/** Makes the public async deserializer interface */
export const makeExternalAsyncDeserializer =
  <T>(validator: InternalAsyncValidator): AsyncDeserializer<T> =>
  async (value, { okToMutateInputValue = false, removeUnknownKeys = false, validation = 'hard' } = {}) => {
    const asyncMaxWorkIntervalMSec = getAsyncMaxWorkIntervalMSec();
    let lastYieldTimeMSec = performance.now();

    const modifiedPaths: Record<string, any> = {};
    const unknownKeysByPath: Partial<Record<string, Set<string> | 'allow-all'>> = {};
    const internalOptions: InternalValidationOptions = {
      transformation: 'deserialize',
      operationValidation: validation,
      schemaValidationPreferences: [],
      shouldRemoveUnknownKeys: removeUnknownKeys,
      inoutModifiedPaths: modifiedPaths,
      inoutUnknownKeysByPath: unknownKeysByPath,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      workingValue: okToMutateInputValue ? value : _.cloneDeep(value),
      shouldRelax: () => performance.now() - lastYieldTimeMSec > asyncMaxWorkIntervalMSec,
      relax: () => {
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

    if (removeUnknownKeys && (output.error === undefined || output.errorLevel !== 'error')) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      processRemoveUnknownKeys({ workingValue: internalOptions.workingValue, unknownKeysByPath });
    }

    if (output.error !== undefined) {
      return {
        error: `${output.error()}${atPath(output.errorPath)}`,
        errorPath: output.errorPath,
        errorLevel: output.errorLevel,
        deserialized: internalOptions.workingValue as T
      };
    } else {
      return {
        deserialized: internalOptions.workingValue as T
      };
    }
  };
