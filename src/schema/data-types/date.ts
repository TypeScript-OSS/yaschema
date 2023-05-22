import _ from 'lodash';

import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Range } from '../../types/range';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { InternalSchemaMakerImpl } from '../internal/internal-schema-maker-impl';
import type { InternalValidationOptions, InternalValidator } from '../internal/types/internal-validation';
import type { LazyPath } from '../internal/types/lazy-path';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { getValidationMode } from '../internal/utils/get-validation-mode';
import { isErrorResult } from '../internal/utils/is-error-result';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';
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
export const date = (...allowedRanges: Array<Range<Date>>): DateSchema => new DateSchemaImpl(...allowedRanges);

// Helpers

class DateSchemaImpl extends InternalSchemaMakerImpl<Date> implements DateSchema {
  // Public Fields

  public readonly allowedRanges: Array<Range<Date>>;

  // PureSchema Field Overrides

  public override readonly schemaType = 'date';

  public override readonly valueType = undefined as any as Date;

  public override readonly estimatedValidationTimeComplexity = 1;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = false;

  public override readonly usesCustomSerDes = true;

  public override readonly isContainerType = false;

  // Initialization

  constructor(...allowedRanges: Array<Range<Date>>) {
    super();

    this.allowedRanges = allowedRanges;
  }

  // Public Methods

  public readonly clone = (): DateSchema => copyMetaFields({ from: this, to: new DateSchemaImpl(...this.allowedRanges) });

  // Method Overrides

  protected override overridableInternalValidate: InternalValidator = (value, validatorOptions, path) => {
    const validationMode = getValidationMode(validatorOptions);

    switch (validatorOptions.transformation) {
      case 'none':
        if (!(value instanceof Date)) {
          return makeErrorResultForValidationMode(validationMode, () => `Expected Date, found ${getMeaningfulTypeof(value)}`, path);
        }

        return this.validateDeserializedForm_(value, validatorOptions, path);
      case 'serialize': {
        if (!(value instanceof Date)) {
          return makeErrorResultForValidationMode(validationMode, () => `Expected Date, found ${getMeaningfulTypeof(value)}`, path);
        }

        const validation = this.validateDeserializedForm_(value, validatorOptions, path);

        value = (value as Date).toISOString();

        validatorOptions.modifyWorkingValueAtPath(path, value);

        if (isErrorResult(validation)) {
          return validation;
        }
        break;
      }
      case 'deserialize': {
        if (typeof value !== 'string' || !dateRegex.test(value)) {
          return makeErrorResultForValidationMode(
            validationMode,
            () => `Expected ISO Date or Date/Time string, found ${getMeaningfulTypeof(value)}`,
            path
          );
        }

        try {
          const date = new Date(value);
          validatorOptions.modifyWorkingValueAtPath(path, date);
          value = date;
        } catch (e) {
          return makeErrorResultForValidationMode(validationMode, () => 'Failed to convert string to Date', path);
        }

        if (!(value instanceof Date)) {
          return makeErrorResultForValidationMode(validationMode, () => `Expected Date, found ${getMeaningfulTypeof(value)}`, path);
        }

        const validation = this.validateDeserializedForm_(value, validatorOptions, path);
        if (isErrorResult(validation)) {
          return validation;
        }
        break;
      }
    }

    return noError;
  };

  protected override overridableInternalValidateAsync = undefined;

  protected override overridableGetExtraToStringFields = () => ({
    allowedRanges: this.allowedRanges
  });

  // Private Methods

  private readonly validateDeserializedForm_: InternalValidator = (
    value: any,
    validatorOptions: InternalValidationOptions,
    path: LazyPath
  ) => {
    const validationMode = getValidationMode(validatorOptions);
    if (validationMode === 'none') {
      return noError;
    }

    if (this.allowedRanges.length > 0) {
      const rangeResult = validateValueInRange(value, { allowed: this.allowedRanges, path, validationMode });
      if (isErrorResult(rangeResult)) {
        return rangeResult;
      }
    }

    return noError;
  };
}
