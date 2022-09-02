import _ from 'lodash';

import type { Validator } from '../../../types/validator';
import type { InternalValidationOptions, InternalValidator } from '../types/internal-validation';
import { atPath } from '../utils/path-utils';
import { sleep } from '../utils/sleep';

/** Makes the public synchronous validator interface */
export const makeExternalValidator =
  (validator: InternalValidator): Validator =>
  (value) => {
    const modifiedPaths: Record<string, any> = {};
    const unknownKeysByPath: Partial<Record<string, Set<string> | 'allow-all'>> = {};
    const internalOptions: InternalValidationOptions = {
      transformation: 'none',
      operationValidation: 'hard',
      schemaValidationPreferences: [],
      shouldRemoveUnknownKeys: false,
      inoutModifiedPaths: modifiedPaths,
      inoutUnknownKeysByPath: unknownKeysByPath,
      workingValue: undefined,
      shouldYield: () => false,
      yield: () => sleep(0)
    };
    const output = validator(value, internalOptions, '');

    if (output.error !== undefined) {
      return {
        error: `${output.error()}${atPath(output.errorPath)}`,
        errorPath: output.errorPath,
        errorLevel: output.errorLevel
      };
    } else {
      return {};
    }
  };
