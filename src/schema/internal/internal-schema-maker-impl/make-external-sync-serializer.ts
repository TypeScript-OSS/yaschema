import isPromise from 'is-promise';

import type { AsyncSerializer, SyncSerializer } from '../../../types/serializer.js';

/** Makes the public sync serializer interface */
export const makeExternalSyncSerializer =
  <T>(serializeAsync: AsyncSerializer<T>): SyncSerializer<T> =>
  (value, options = {}) => {
    const serialization = serializeAsync(value, { ...options, forceSync: true });
    if (isPromise(serialization)) {
      throw new Error('This schema requires async serialization, use serializeAsync instead');
    } else {
      return serialization;
    }
  };
