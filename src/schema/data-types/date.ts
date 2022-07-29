import _ from 'lodash';

import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import { Range } from '../../types/range';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalValidationOptions, InternalValidator } from '../internal/types/internal-validation';
import { atPath } from '../internal/utils/path-utils';
import { validateValueInRange } from '../internal/utils/validate-value-in-range';

// TODO: add option for serializedAsString

/** Requires a `Date`, which will be serialized as an ISO Date/Time string */
export interface DateSchema extends Schema<Date> {
  schemaType: 'date';

  /** If one or more values are specified, the value must be equal to one of the specified values or in one of the specified ranges */
  allowedRanges?: Array<Range<Date>>;
}

/** ISO DateTime string */
const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(.\d{3})?)?(Z|[+-]\d{2}(:\d{2})?)?)?$/;

/** Requires a `Date`, which will be serialized as an ISO Date/Time string */
export const date = (allowedRanges: Array<Range<Date>> = []): DateSchema => {
  const validateDeserializedForm: InternalValidator = (value: any, validatorOptions: InternalValidationOptions, path: string) => {
    if (validatorOptions.validation === 'none') {
      return noError;
    }

    if (allowedRanges.length > 0) {
      const rangeResult = validateValueInRange(value, { allowed: allowedRanges, path });
      if (rangeResult.error !== undefined) {
        return rangeResult;
      }
    }

    return noError;
  };

  const internalValidate: InternalValidator = (value, validatorOptions, path) => {
    switch (validatorOptions.transformation) {
      case 'none':
        if (!(value instanceof Date)) {
          return { error: () => `Expected Date, found ${getMeaningfulTypeof(value)}${atPath(path)}` };
        }

        return validateDeserializedForm(value, validatorOptions, path);
      case 'serialize': {
        if (!(path in validatorOptions.inoutModifiedPaths)) {
          if (!(value instanceof Date)) {
            return { error: () => `Expected Date, found ${getMeaningfulTypeof(value)}${atPath(path)}` };
          }

          const validation = validateDeserializedForm(value, validatorOptions, path);

          value = (value as Date).toISOString();

          if (path === '') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            validatorOptions.workingValue = value;
          } else {
            _.set(validatorOptions.workingValue, path, value);
          }

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          validatorOptions.inoutModifiedPaths[path] = value;

          if (validation.error !== undefined) {
            return validation;
          }
        }
        break;
      }
      case 'deserialize': {
        if (!(path in validatorOptions.inoutModifiedPaths)) {
          if (typeof value !== 'string' || !dateRegex.test(value)) {
            return { error: () => `Expected ISO Date or Date/Time string, found ${getMeaningfulTypeof(value)}${atPath(path)}` };
          }

          try {
            const date = new Date(value);
            validatorOptions.inoutModifiedPaths[path] = date;
            value = date;
          } catch (e) {
            return { error: () => `Failed to convert string to Date${atPath(path)}` };
          }

          if (!(value instanceof Date)) {
            return { error: () => `Expected Date, found ${getMeaningfulTypeof(value)}${atPath(path)}` };
          }

          const validation = validateDeserializedForm(value, validatorOptions, path);
          if (validation.error !== undefined) {
            return validation;
          }
        }
        break;
      }
    }

    return noError;
  };

  return makeInternalSchema(
    {
      valueType: undefined as any as Date,
      schemaType: 'date',
      estimatedValidationTimeComplexity: 1,
      usesCustomSerDes: true
    },
    { internalValidate }
  );
};
