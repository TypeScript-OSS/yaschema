import _ from 'lodash';

import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof';
import type { Range } from '../../../types/range';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl';
import type { InternalTransformationType, InternalValidator } from '../../internal/types/internal-validation';
import { cloner } from '../../internal/utils/cloner';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields';
import { isErrorResult } from '../../internal/utils/is-error-result';
import { makeErrorResultForValidationMode } from '../../internal/utils/make-error-result-for-validation-mode';
import { makeNoError } from '../../internal/utils/make-no-error';
import { validateValueInRange } from '../../internal/utils/validate-value-in-range';
import type { DateSchema } from '../types/DateSchema';

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

  protected override overridableInternalValidate: InternalValidator = (value, internalState, path, container, validationMode) =>
    this.internalValidatorsByTransformationType_[internalState.transformation](value, internalState, path, container, validationMode);

  protected override overridableInternalValidateAsync = undefined;

  protected override overridableGetExtraToStringFields = () => ({
    allowedRanges: this.allowedRanges
  });

  // Private Methods

  private readonly internalValidateNoTransform_: InternalValidator = (value, internalState, path, container, validationMode) => {
    if (!(value instanceof Date)) {
      return makeErrorResultForValidationMode(
        cloner(value),
        validationMode,
        () => `Expected Date, found ${getMeaningfulTypeof(value)}`,
        path
      );
    }

    return this.validateDeserializedForm_(new Date(value), internalState, path, container, validationMode);
  };

  private readonly internalValidateSerialize_: InternalValidator = (value, internalState, path, container, validationMode) => {
    if (!(value instanceof Date)) {
      return makeErrorResultForValidationMode(
        cloner(value),
        validationMode,
        () => `Expected Date, found ${getMeaningfulTypeof(value)}`,
        path
      );
    }

    const dateValue = value;

    const validation = this.validateDeserializedForm_(dateValue, internalState, path, container, validationMode);

    const isoStringValue = dateValue.toISOString();

    return isErrorResult(validation) ? { ...validation, invalidValue: () => isoStringValue } : makeNoError(isoStringValue);
  };

  private readonly internalValidateDeserialize_: InternalValidator = (value, internalState, path, container, validationMode) => {
    if (typeof value !== 'string' || !dateRegex.test(value)) {
      return makeErrorResultForValidationMode(
        cloner(value),
        validationMode,
        () => `Expected ISO Date or Date/Time string, found ${getMeaningfulTypeof(value)}`,
        path
      );
    }

    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return makeErrorResultForValidationMode(
          cloner(value),
          validationMode,
          () => `Expected ISO Date or Date/Time string, found ${getMeaningfulTypeof(value)}`,
          path
        );
      }

      return this.validateDeserializedForm_(date, internalState, path, container, validationMode);
    } catch (e) {
      return makeErrorResultForValidationMode(cloner(value), validationMode, () => 'Failed to convert string to Date', path);
    }
  };

  private readonly internalValidatorsByTransformationType_: Record<InternalTransformationType, InternalValidator> = {
    deserialize: this.internalValidateDeserialize_,
    none: this.internalValidateNoTransform_,
    serialize: this.internalValidateSerialize_
  };

  private readonly validateDeserializedForm_: InternalValidator = (value, _validatorOptions, path, _container, validationMode) => {
    if (validationMode === 'none') {
      return makeNoError(value);
    }

    if (this.allowedRanges.length > 0) {
      const rangeResult = validateValueInRange(value, { allowed: this.allowedRanges, path, validationMode });
      if (isErrorResult(rangeResult)) {
        return rangeResult;
      }
    }

    return makeNoError(value);
  };
}
