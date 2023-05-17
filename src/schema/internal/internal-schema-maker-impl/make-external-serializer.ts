import _ from 'lodash';

import type { JsonValue } from '../../../types/json-value';
import type { Serializer } from '../../../types/serializer';
import type { InternalValidationOptions, InternalValidator } from '../types/internal-validation';
import { atPath, resolveLazyPath } from '../utils/path-utils';
import { processRemoveUnknownKeys } from '../utils/process-remove-unknown-keys';
import { sleep } from '../utils/sleep';

/** Makes the public synchronous serializer interface */
export const makeExternalSerializer = <ValueT>(validator: InternalValidator): Serializer<ValueT> => {
  return (value, { okToMutateInputValue = false, removeUnknownKeys = false, validation = 'hard' } = {}) => {
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
      shouldRelax: () => false,
      relax: () => sleep(0)
    };
    const output = validator(internalOptions.workingValue, internalOptions, '');

    if (removeUnknownKeys && (output.error === undefined || output.errorLevel !== 'error')) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      processRemoveUnknownKeys({ workingValue: internalOptions.workingValue, unknownKeysByPath });
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
