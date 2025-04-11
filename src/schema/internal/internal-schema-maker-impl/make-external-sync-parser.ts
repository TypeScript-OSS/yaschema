import isPromise from 'is-promise';

import type { AsyncParser, SyncParser } from '../../../types/deserializer.js';

/** Makes the public sync parser interface */
export const makeExternalSyncParser =
  <T>(parseAsync: AsyncParser<T>): SyncParser<T> =>
  (value, options = {}): T => {
    const parsed = parseAsync(value, { ...options, forceSync: true });
    if (isPromise(parsed)) {
      throw new Error('This schema requires async deserialization, use parseAsync instead');
    } else {
      return parsed;
    }
  };
