import isPromise from 'is-promise';

import type { TypeOrPromisedType } from '../../types/TypeOrPromisedType.js';
import { inline } from './inline.js';

export const forOfAsync = <T, ReturnT>(items: T[], callback: (item: T) => TypeOrPromisedType<ReturnT | undefined>) => {
  let index = 0;

  const numItems = items.length;
  while (index < numItems) {
    const result = callback(items[index]);
    if (isPromise(result)) {
      return inline(async () => {
        // If any results are promises, assume they all are

        const resolved = await result;
        if (resolved !== undefined) {
          return resolved;
        }

        index += 1;

        while (index < numItems) {
          const result = await callback(items[index]);
          if (result !== undefined) {
            return result;
          }

          index += 1;
        }

        return undefined;
      });
    } else {
      if (result !== undefined) {
        return result;
      }

      index += 1;
    }
  }

  return undefined;
};
