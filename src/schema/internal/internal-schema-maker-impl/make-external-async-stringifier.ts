import { withResolved } from '../../../internal/utils/withResolved.js';
import type { AsyncSerializer, AsyncStringifier } from '../../../types/serializer.js';

/** Makes the public async stringifier interface */
export const makeExternalAsyncStringifier =
  <T>(serializeAsync: AsyncSerializer<T>): AsyncStringifier<T> =>
  (value, options = {}) => {
    const serialization = serializeAsync(value, options);
    return withResolved(serialization, (serialization) => {
      if (serialization.error !== undefined) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw serialization;
      }

      try {
        return JSON.stringify(serialization.serialized, options.replacer, options.space);
      } catch (_e) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw {
          error: 'Invalid JSON value',
          errorPath: '',
          errorLevel: 'error'
        };
      }
    });
  };
