import isPromise from 'is-promise';

import type { AsyncCloner, SyncCloner } from '../../../types/cloner.js';

/** Makes the public sync clone interface */
export const makeExternalSyncCloner =
  <T>(cloneValueAsync: AsyncCloner<T>): SyncCloner<T> =>
  (value, options = {}) => {
    const deserialization = cloneValueAsync(value, { ...options, forceSync: true });
    if (isPromise(deserialization)) {
      throw new Error('This schema requires async cloning, use cloneValueAsync instead');
    } else {
      return deserialization;
    }
  };
