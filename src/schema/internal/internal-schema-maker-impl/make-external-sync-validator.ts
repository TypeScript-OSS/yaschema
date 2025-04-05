import isPromise from 'is-promise';

import type { AsyncValidator, SyncValidator } from '../../../types/validator.js';

/** Makes the public sync validator interface */
export const makeExternalSyncValidator =
  (validateAsync: AsyncValidator): SyncValidator =>
  (value, options = {}) => {
    const validation = validateAsync(value, { ...options, forceSync: true });
    if (isPromise(validation)) {
      throw new Error('This schema requires async validation, use validateAsync instead');
    } else {
      return validation;
    }
  };
