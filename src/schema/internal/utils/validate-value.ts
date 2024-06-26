import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof.js';
import type { ValidationMode } from '../../../types/validation-options';
import type { InternalValidationResult } from '../types/internal-validation';
import type { LazyPath } from '../types/lazy-path';
import { makeErrorResultForValidationMode } from './make-error-result-for-validation-mode.js';
import { makeNoError } from './make-no-error.js';

/** Checks that the specified value is one of the specified allowed values using `.has` on the set. */
export const validateValue = <ValueT extends boolean | number | string>(
  value: any,
  { allowed, path, validationMode }: { allowed: Set<ValueT>; path: LazyPath; validationMode: ValidationMode }
): InternalValidationResult => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  if (!allowed.has(value)) {
    let valueAsString = '';
    const theType = typeof value;
    if (theType === 'string') {
      valueAsString = value as string;
      if (valueAsString.length > 64) {
        valueAsString = ` (${JSON.stringify(`${valueAsString.substr(0, 64)}…`)})`;
      } else {
        valueAsString = ` (${JSON.stringify(value)})`;
      }
    } else if (theType === 'number' || theType === 'boolean') {
      valueAsString = ` (${JSON.stringify(value)})`;
    }

    return makeErrorResultForValidationMode(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      () => value,
      validationMode,
      () =>
        `Expected one of ${Array.from(allowed)
          .map((v) => JSON.stringify(v))
          .join(', ')}, found ${getMeaningfulTypeof(value)}${valueAsString}`,
      path
    );
  }

  return makeNoError(value);
};
