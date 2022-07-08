import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof';
import { noError } from '../consts';
import { atPath } from './path-utils';

/** Checks that the specified value is one of the specified allowed values using `.has` on the set. */
export const validateValue = <ValueT extends boolean | number | string>(
  value: any,
  { allowed, path }: { allowed: Set<ValueT>; path: string }
) => {
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

    return {
      error: () =>
        `Expected one of ${Array.from(allowed)
          .map((v) => JSON.stringify(v))
          .join(', ')}, found ${getMeaningfulTypeof(value)}${valueAsString}${atPath(path)}`
    };
  }

  return noError;
};
