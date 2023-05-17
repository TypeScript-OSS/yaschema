import _ from 'lodash';

import { getAsyncMaxWorkIntervalMSec } from '../../../config/async-max-work-interval-msec';
import type { AsyncDeserializer } from '../../../types/deserializer';
import type { InternalAsyncValidator, MutableInternalValidationOptions } from '../types/internal-validation';
import { atPath, resolveLazyPath } from '../utils/path-utils';
import { processRemoveUnknownKeys } from '../utils/process-remove-unknown-keys';
import { sleep } from '../utils/sleep';

/** Makes the public async deserializer interface */
export const makeExternalAsyncDeserializer =
  <T>(validator: InternalAsyncValidator): AsyncDeserializer<T> =>
  async (value, { okToMutateInputValue = false, removeUnknownKeys = false, validation = 'hard' } = {}) => {
    const asyncMaxWorkIntervalMSec = getAsyncMaxWorkIntervalMSec();
    let lastYieldTimeMSec = performance.now();

    let wasWorkingValueCloned = false;
    const cloneWorkingValueIfNeeded = () => {
      if (okToMutateInputValue || wasWorkingValueCloned) {
        return; // Nothing to do
      }

      wasWorkingValueCloned = true;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      internalOptions.workingValue = _.cloneDeep(internalOptions.workingValue);
    };

    let hasModifiedValues = false;
    const modifiedPaths = new Map<string, any>();
    const unknownKeysByPath: Partial<Record<string, Set<string> | 'allow-all'>> = {};
    const internalOptions: MutableInternalValidationOptions = {
      transformation: 'deserialize',
      operationValidation: validation,
      schemaValidationPreferences: [],
      shouldRemoveUnknownKeys: removeUnknownKeys,
      inoutModifiedPaths: modifiedPaths,
      inoutUnknownKeysByPath: unknownKeysByPath,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      workingValue: value,
      modifyWorkingValueAtPath: (path, newValue) => {
        hasModifiedValues = true;
        const resolvedPath = resolveLazyPath(path);

        // If the root is replaced there's no need to clone and any previously set values don't matter
        if (resolvedPath === '') {
          wasWorkingValueCloned = true;
          modifiedPaths.clear();
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        modifiedPaths.set(resolvedPath, newValue);
      },
      shouldRelax: () => performance.now() - lastYieldTimeMSec > asyncMaxWorkIntervalMSec,
      relax: () => {
        lastYieldTimeMSec = performance.now();
        return sleep(0);
      }
    };

    const output = await validator(value, internalOptions, '');

    if (hasModifiedValues) {
      cloneWorkingValueIfNeeded();

      // For deserialize, we update the object after validation
      for (const [path, newValue] of modifiedPaths.entries()) {
        if (path === '') {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          internalOptions.workingValue = newValue;
        } else {
          _.set(internalOptions.workingValue, path, newValue);
        }
      }
    }

    if (removeUnknownKeys && (output.error === undefined || output.errorLevel !== 'error')) {
      processRemoveUnknownKeys({ internalOptions, cloneWorkingValueIfNeeded, unknownKeysByPath });
    }

    if (output.error !== undefined) {
      return {
        error: `${output.error()}${atPath(output.errorPath)}`,
        errorPath: resolveLazyPath(output.errorPath),
        errorLevel: output.errorLevel,
        deserialized: internalOptions.workingValue as T
      };
    } else {
      return {
        deserialized: internalOptions.workingValue as T
      };
    }
  };
