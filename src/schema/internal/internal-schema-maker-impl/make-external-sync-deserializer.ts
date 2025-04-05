import isPromise from 'is-promise';

import type { AsyncDeserializer, SyncDeserializer } from '../../../types/deserializer.js';

/** Makes the public sync deserializer interface */
export const makeExternalSyncDeserializer =
  <T>(deserializeAsync: AsyncDeserializer<T>): SyncDeserializer<T> =>
  (value, options = {}) => {
    const deserialization = deserializeAsync(value, { ...options, forceSync: true });
    if (isPromise(deserialization)) {
      throw new Error('This schema requires async deserialization, use deserializeAsync instead');
    } else {
      return deserialization;
    }
  };
