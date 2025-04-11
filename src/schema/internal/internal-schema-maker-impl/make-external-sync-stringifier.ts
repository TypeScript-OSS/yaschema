import isPromise from 'is-promise';

import type { AsyncStringifier, SyncStringifier } from '../../../types/serializer.js';

/** Makes the public sync stringifier interface */
export const makeExternalSyncStringifier =
  <T>(stringifyAsync: AsyncStringifier<T>): SyncStringifier<T> =>
  (value, options = {}) => {
    const jsonString = stringifyAsync(value, { ...options, forceSync: true });
    if (isPromise(jsonString)) {
      throw new Error('This schema requires async serialization, use stringifyAsync instead');
    } else {
      return jsonString;
    }
  };
