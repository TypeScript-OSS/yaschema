import _ from 'lodash';

import type { Validator } from '../../../types/validator';
import type { InternalValidationOptions, InternalValidator } from '../types/internal-validation';
import { sleep } from '../utils/sleep';

/** Makes the public synchronous validator interface */
export const makeExternalValidator =
  (validator: InternalValidator): Validator =>
  (value) => {
    const modifiedPaths: Record<string, any> = {};
    const internalOptions: InternalValidationOptions = {
      transformation: 'none',
      validation: 'hard',
      inoutModifiedPaths: modifiedPaths,
      workingValue: undefined,
      shouldYield: () => false,
      yield: () => sleep(0)
    };
    const output = validator(value, internalOptions, '');

    return { error: output.error?.() };
  };
