import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalValidator } from '../internal/types/internal-validation';
import { atPath } from '../internal/utils/path-utils';
import { validateValue } from '../internal/utils/validate-value';

// TODO: add option for serializedAsString

/** Requires a real, finite number, optionally matching one of the specified values. */
export interface NumberSchema<ValueT extends number> extends Schema<ValueT> {
  schemaType: 'number';
  allowedValues: ValueT[];
}

/** Requires a real, finite number.  If one or more values are specified, the value must also be equal to one of the specified values */
export const number = <ValueT extends number>(...allowedValues: ValueT[]): NumberSchema<ValueT> => {
  const equalsNumbers = allowedValues.filter((v): v is ValueT => typeof v === 'number');

  const equalsNumbersSet = new Set(equalsNumbers);

  const internalValidate: InternalValidator = (value, validatorOptions, path) => {
    if (typeof value !== 'number') {
      return { error: () => `Expected number, found ${getMeaningfulTypeof(value)}${atPath(path)}` };
    }

    if (validatorOptions.validation === 'none') {
      return noError;
    }

    if (Number.isNaN(value)) {
      return { error: () => `Found NaN${atPath(path)}` };
    } else if (!Number.isFinite(value)) {
      return { error: () => `Found non-finite value${atPath(path)}` };
    }

    if (equalsNumbers.length > 0) {
      const result = validateValue(value, { allowed: equalsNumbersSet, path });
      if (result.error !== undefined) {
        return result;
      }
    }

    return noError;
  };

  return makeInternalSchema(
    {
      valueType: undefined as any as ValueT,
      schemaType: 'number',
      allowedValues,
      estimatedValidationTimeComplexity: allowedValues.length + 1,
      usesCustomSerDes: false
    },
    { internalValidate }
  );
};
