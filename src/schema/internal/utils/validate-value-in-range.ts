import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof';
import type { Range } from '../../../types/range';
import type { ValidationMode } from '../../../types/validation-options';
import { noError } from '../consts';
import type { InternalValidationResult } from '../types/internal-validation';
import type { LazyPath } from '../types/lazy-path';
import { makeErrorResultForValidationMode } from './make-error-result-for-validation-mode';

export const validateValueInRange = <T extends number | Date>(
  value: T,
  { allowed, path, validationMode }: { allowed: Range<T>[]; path: LazyPath; validationMode: ValidationMode }
): InternalValidationResult => {
  if (allowed.find((range) => isValueInRange(value, range)) === undefined) {
    return makeErrorResultForValidationMode(
      validationMode,
      () =>
        `Expected a value in ${allowed
          .map((range) => {
            const parts: string[] = [];
            if (range.min !== undefined) {
              parts.push(`${range.minExclusive ? '>' : '>='} ${JSON.stringify(range.min)}`);
            }
            if (range.max !== undefined) {
              parts.push(`${range.maxExclusive ? '<' : '<='} ${JSON.stringify(range.max)}`);
            }

            return `(${parts.join(' and ')})`;
          })
          .join(' or ')}, found ${getMeaningfulTypeof(value)}`,
      path
    );
  }

  return noError;
};

// Helpers

const isValueInRange = <T extends number | Date>(value: T, range: Range<T>) => {
  if (range.min !== undefined) {
    if (range.minExclusive) {
      if (value <= range.min) {
        return false;
      }
    } else if (value < range.min) {
      return false;
    }
  }

  if (range.max !== undefined) {
    if (range.maxExclusive) {
      if (value >= range.max) {
        return false;
      }
    } else if (value > range.max) {
      return false;
    }
  }

  return true;
};
