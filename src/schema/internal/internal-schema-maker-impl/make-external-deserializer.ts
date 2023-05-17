import _ from 'lodash';

import type { Deserializer } from '../../../types/deserializer';
import type { InternalValidator, MutableInternalValidationOptions } from '../types/internal-validation';
import { atPath, resolveLazyPath } from '../utils/path-utils';
import { processRemoveUnknownKeys } from '../utils/process-remove-unknown-keys';
import { sleep } from '../utils/sleep';

/** Makes the public synchronous deserializer interface */
export const makeExternalDeserializer =
  <T>(validator: InternalValidator): Deserializer<T> =>
  (value, { okToMutateInputValue = false, removeUnknownKeys = false, validation = 'hard' } = {}) => {
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
      shouldRelax: () => false,
      relax: () => sleep(0)
    };
    const output = validator(value, internalOptions, '');

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
