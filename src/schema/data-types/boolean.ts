import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalValidator } from '../internal/types/internal-validation';
import { atPath } from '../internal/utils/path-utils';
import { validateValue } from '../internal/utils/validate-value';

// TODO: add option for serializedAsString

/** Requires a boolean, optionally matching one of the specified values. */
export interface BooleanSchema<ValueT extends boolean> extends Schema<ValueT> {
  schemaType: 'boolean';
  allowedValues: ValueT[];
}

/** Requires a boolean.  If one or more values are specified, the boolean must also match one of the specified values. */
export const boolean = <ValueT extends boolean>(...allowedValues: ValueT[]): BooleanSchema<ValueT> => {
  const equalsSet = new Set(allowedValues);

  const internalValidate: InternalValidator = (value, validatorOptions, path) => {
    if (typeof value !== 'boolean') {
      return { error: () => `Expected boolean, found ${getMeaningfulTypeof(value)}${atPath(path)}` };
    }

    if (validatorOptions.validation === 'none') {
      return noError;
    }

    if (allowedValues.length > 0) {
      return validateValue(value, { allowed: equalsSet, path });
    }

    return noError;
  };

  return makeInternalSchema(
    {
      valueType: undefined as any as ValueT,
      schemaType: 'boolean',
      allowedValues,
      estimatedValidationTimeComplexity: 1,
      usesCustomSerDes: false
    },
    { internalValidate }
  );
};
