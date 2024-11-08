import isPromise from 'is-promise';

import type { TypeOrPromisedType } from '../../types/TypeOrPromisedType.js';
import { inline } from './inline.js';

export const forAsync = <ReturnT>(
  initialValue: number,
  shouldContinue: (index: number) => boolean,
  stepper: number | ((index: number) => number),
  callback: (index: number) => TypeOrPromisedType<ReturnT | undefined>
) => {
  let index = initialValue;

  const step =
    typeof stepper === 'number'
      ? () => {
          index = index + stepper;
        }
      : () => {
          index = stepper(index);
        };

  while (shouldContinue(index)) {
    const result = callback(index);
    if (isPromise(result)) {
      return inline(async () => {
        // If any results are promises, assume they all are

        const resolved = await result;
        if (resolved !== undefined) {
          return resolved;
        }

        step();

        while (shouldContinue(index)) {
          const result = await callback(index);
          if (result !== undefined) {
            return result;
          }

          step();
        }

        return undefined;
      });
    } else {
      if (result !== undefined) {
        return result;
      }

      step();
    }
  }

  return undefined;
};
