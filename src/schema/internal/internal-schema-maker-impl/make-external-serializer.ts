import _ from 'lodash';

import type { JsonValue } from '../../../types/json-value';
import type { Serializer } from '../../../types/serializer';
import type { InternalValidator, MutableInternalValidationOptions } from '../types/internal-validation';
import { atPath, resolveLazyPath } from '../utils/path-utils';
import { processRemoveUnknownKeys } from '../utils/process-remove-unknown-keys';
import { sleep } from '../utils/sleep';

/** Makes the public synchronous serializer interface */
export const makeExternalSerializer = <ValueT>(validator: InternalValidator): Serializer<ValueT> => {
  return (value, { okToMutateInputValue = false, removeUnknownKeys = false, validation = 'hard' } = {}) => {
    let wasWorkingValueCloned = false;
    const cloneWorkingValueIfNeeded = () => {
      if (okToMutateInputValue || wasWorkingValueCloned) {
        return; // Nothing to do
      }

      wasWorkingValueCloned = true;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      internalOptions.workingValue = _.cloneDeep(internalOptions.workingValue);
    };

    const modifiedPaths = new Map<string, any>();
    const unknownKeysByPath: Partial<Record<string, Set<string> | 'allow-all'>> = {};
    const internalOptions: MutableInternalValidationOptions = {
      transformation: 'serialize',
      operationValidation: validation,
      schemaValidationPreferences: [],
      shouldRemoveUnknownKeys: removeUnknownKeys,
      inoutModifiedPaths: modifiedPaths,
      inoutUnknownKeysByPath: unknownKeysByPath,
      workingValue: value,
      modifyWorkingValueAtPath: (path, newValue) => {
        const resolvedPath = resolveLazyPath(path);
        if (resolvedPath === '') {
          // If the root is replaced there's no need to clone and any previously set values don't matter
          wasWorkingValueCloned = true;
          modifiedPaths.clear();

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          internalOptions.workingValue = newValue;
        } else {
          cloneWorkingValueIfNeeded();
          _.set(internalOptions.workingValue, resolvedPath, newValue);
        }

        modifiedPaths.set(resolvedPath, newValue);
      },
      shouldRelax: () => false,
      relax: () => sleep(0)
    };

    const output = validator(internalOptions.workingValue, internalOptions, '');

    if (removeUnknownKeys && (output.error === undefined || output.errorLevel !== 'error')) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      processRemoveUnknownKeys({ internalOptions, cloneWorkingValueIfNeeded, unknownKeysByPath });
    }

    if (output.error !== undefined) {
      return {
        error: `${output.error()}${atPath(output.errorPath)}`,
        errorPath: resolveLazyPath(output.errorPath),
        errorLevel: output.errorLevel,
        serialized: internalOptions.workingValue as JsonValue
      };
    } else {
      return {
        serialized: internalOptions.workingValue as JsonValue
      };
    }
  };
};
