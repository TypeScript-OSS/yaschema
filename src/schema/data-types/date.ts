import _ from 'lodash';

import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Range } from '../../types/range';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalValidationOptions, InternalValidator } from '../internal/types/internal-validation';
import type { LazyPath } from '../internal/types/lazy-path';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { getValidationMode } from '../internal/utils/get-validation-mode';
import { isErrorResult } from '../internal/utils/is-error-result';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';
import { resolveLazyPath } from '../internal/utils/path-utils';
import { validateValueInRange } from '../internal/utils/validate-value-in-range';

/** Requires a `Date`, which will be serialized as an ISO Date/Time string */
export interface DateSchema extends Schema<Date> {
  schemaType: 'date';
  clone: () => DateSchema;

  /** If one or more values are specified, the value must be equal to one of the specified values or in one of the specified ranges */
  allowedRanges?: Array<Range<Date>>;
}

/** ISO DateTime string */
const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(.\d{1,9})?)?(Z|[+-]\d{2}(:\d{2})?)?)?$/;

/** Requires a `Date`, which will be serialized as an ISO Date/Time string */
export const date = (allowedRanges: Array<Range<Date>> = []): DateSchema => {
  const validateDeserializedForm: InternalValidator = (value: any, validatorOptions: InternalValidationOptions, path: LazyPath) => {
    const validationMode = getValidationMode(validatorOptions);
    if (validationMode === 'none') {
      return noError;
    }

    if (allowedRanges.length > 0) {
      const rangeResult = validateValueInRange(value, { allowed: allowedRanges, path, validationMode });
      if (isErrorResult(rangeResult)) {
        return rangeResult;
      }
    }

    return noError;
  };

  const internalValidate: InternalValidator = (value, validatorOptions, path) => {
    const validationMode = getValidationMode(validatorOptions);

    switch (validatorOptions.transformation) {
      case 'none':
        if (!(value instanceof Date)) {
          return makeErrorResultForValidationMode(validationMode, () => `Expected Date, found ${getMeaningfulTypeof(value)}`, path);
        }

        return validateDeserializedForm(value, validatorOptions, path);
      case 'serialize': {
        const resolvedPath = resolveLazyPath(path);
        if (!(resolvedPath in validatorOptions.inoutModifiedPaths)) {
          if (!(value instanceof Date)) {
            return makeErrorResultForValidationMode(
              validationMode,
              () => `Expected Date, found ${getMeaningfulTypeof(value)}`,
              resolvedPath
            );
          }

          const validation = validateDeserializedForm(value, validatorOptions, resolvedPath);

          value = (value as Date).toISOString();

          if (resolvedPath === '') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            validatorOptions.workingValue = value;
          } else {
            _.set(validatorOptions.workingValue, resolvedPath, value);
          }

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          validatorOptions.inoutModifiedPaths[resolvedPath] = value;

          if (isErrorResult(validation)) {
            return validation;
          }
        }
        break;
      }
      case 'deserialize': {
        const resolvedPath = resolveLazyPath(path);
        if (!(resolvedPath in validatorOptions.inoutModifiedPaths)) {
          if (typeof value !== 'string' || !dateRegex.test(value)) {
            return makeErrorResultForValidationMode(
              validationMode,
              () => `Expected ISO Date or Date/Time string, found ${getMeaningfulTypeof(value)}`,
              resolvedPath
            );
          }

          try {
            const date = new Date(value);
            validatorOptions.inoutModifiedPaths[resolvedPath] = date;
            value = date;
          } catch (e) {
            return makeErrorResultForValidationMode(validationMode, () => 'Failed to convert string to Date', resolvedPath);
          }

          if (!(value instanceof Date)) {
            return makeErrorResultForValidationMode(
              validationMode,
              () => `Expected Date, found ${getMeaningfulTypeof(value)}`,
              resolvedPath
            );
          }

          const validation = validateDeserializedForm(value, validatorOptions, resolvedPath);
          if (isErrorResult(validation)) {
            return validation;
          }
        }
        break;
      }
    }

    return noError;
  };

  const fullSchema: DateSchema = makeInternalSchema(
    {
      valueType: undefined as any as Date,
      schemaType: 'date',
      clone: () => copyMetaFields({ from: fullSchema, to: date(fullSchema.allowedRanges) }),
      estimatedValidationTimeComplexity: 1,
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: false,
      usesCustomSerDes: true
    },
    { internalValidate }
  );

  return fullSchema;
};
