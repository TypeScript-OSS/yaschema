import _ from 'lodash';

import type { Deserializer } from '../../../types/deserializer';
import type { InternalValidationOptions, InternalValidator } from '../types/internal-validation';
import { atPath } from '../utils/path-utils';
import { processRemoveUnknownKeys } from '../utils/process-remove-unknown-keys';
import { sleep } from '../utils/sleep';

/** Makes the public synchronous deserializer interface */
export const makeExternalDeserializer =
  <T>(validator: InternalValidator): Deserializer<T> =>
  (value, { okToMutateInputValue = false, removeUnknownKeys = false, validation = 'hard' } = {}) => {
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
