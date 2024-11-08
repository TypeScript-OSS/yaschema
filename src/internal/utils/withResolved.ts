import isPromise from 'is-promise';

import type { TypeOrPromisedType } from '../../types/TypeOrPromisedType.js';
import { inline } from './inline.js';

export const withResolved = <T, ReturnT>(
  value: TypeOrPromisedType<T>,
  callback: (value: T) => TypeOrPromisedType<ReturnT>,
  onError?: (error: any) => ReturnT
): TypeOrPromisedType<ReturnT> => {
  if (isPromise(value)) {
    return inline(async () => {
      try {
        const resolved = await value;
        return callback(resolved);
      } catch (e) {
        if (onError !== undefined) {
          return onError(e);
        }

        throw e;
      }
    });
  } else {
    return callback(value);
  }
};
