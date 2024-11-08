import isPromise from 'is-promise';

import type { TypeOrPromisedType } from '../../types/TypeOrPromisedType.js';
import { inline } from './inline.js';

export const whileAsync = <ReturnT>(shouldContinue: () => boolean, callback: () => TypeOrPromisedType<ReturnT | undefined>) => {
  while (shouldContinue()) {
    const result = callback();
    if (isPromise(result)) {
      return inline(async () => {
        // If any results are promises, assume they all are

        const resolved = await result;
        if (resolved !== undefined) {
          return resolved;
        }

        while (shouldContinue()) {
          const result = await callback();
          if (result !== undefined) {
            return result;
          }
        }

        return undefined;
      });
    } else {
      if (result !== undefined) {
        return result;
      }
    }
  }

  return undefined;
};
