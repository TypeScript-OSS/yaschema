import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof';
import type { Range } from '../../../types/range';
import type { Schema } from '../../../types/schema';
import type { ValidationMode } from '../../../types/validation-options';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl';
import type { GenericContainer } from '../../internal/types/generic-container';
import type { InternalValidationResult } from '../../internal/types/internal-validation';
import type { LazyPath } from '../../internal/types/lazy-path';
import { cloner } from '../../internal/utils/cloner';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields';
import { isErrorResult } from '../../internal/utils/is-error-result';
import { makeErrorResultForValidationMode } from '../../internal/utils/make-error-result-for-validation-mode';
import { makeNoError } from '../../internal/utils/make-no-error';
import { supportVariableSerializationFormsForNumericValues } from '../../internal/utils/support-variable-serialization-forms-for-numeric-values';
import { validateValue } from '../../internal/utils/validate-value';
import { validateValueInRange } from '../../internal/utils/validate-value-in-range';
import type { RestrictedNumberOptions } from '../types/RestrictedNumberOptions';

/** Requires a real, finite number, optionally matching one of the specified values or in one of the specified ranges and optionally being
 * divisible by one of the specified divisors. */
export interface RestrictedNumberSchema extends Schema<number> {
  schemaType: 'restrictedNumber';
  clone: () => RestrictedNumberSchema;

  /** If one or more values are specified, the value must be equal to one of the specified values or in one of the specified ranges */
  allowedValuesAndRanges: Array<number | Range<number>>;
  /** If one or more values are specified, the value must be divisible by one of the specified options */
  divisibleBy: number[];

  /**
   * For serialization, the first type will be used. `['number']` is assumed if nothing is specified.
   *
   * For deserialization, forms are tried in order.
   */
  allowedSerializationForms?: Array<'number' | 'string'>;
  /** Sets (replaces) the allowed serialization forms metadata for this schema and returns the same schema */
  setAllowedSerializationForms: (allowed?: Array<'number' | 'string'>) => this;
}

/** Requires a real, finite number.  If one or more values and/or ranges are specified, the value must also be equal to one of the specified
 * values or in one of the specified ranges.  If one or more divisors are specified, the value must also be divisible by one of the
 * specified divisors. */
export const restrictedNumber = (
  allowedValuesAndRanges: Array<number | Range<number>>,
  options?: RestrictedNumberOptions
): RestrictedNumberSchema => new RestrictedNumberSchemaImpl(allowedValuesAndRanges, options);

// Helpers

const isValueDivisibleBy = (value: number, divisor: number) => value % divisor === 0;

const validateValueIsDivisibleBy = (
  value: number,
  { allowed }: { allowed: number[] },
  path: LazyPath,
  _container: GenericContainer,
  validationMode: ValidationMode
): InternalValidationResult => {
  if (allowed.find((divisor) => isValueDivisibleBy(value, divisor)) === undefined) {
    return makeErrorResultForValidationMode(
      () => value,
      validationMode,
      () => `Expected a value divisible by ${allowed.join(' or ')}, found ${getMeaningfulTypeof(value)}`,
      path
    );
  }

  return makeNoError(value);
};

class RestrictedNumberSchemaImpl extends InternalSchemaMakerImpl<number> implements RestrictedNumberSchema {
  // Public Fields

  public allowedSerializationForms?: Array<'number' | 'string'>;

  public readonly allowedValuesAndRanges: Array<number | Range<number>>;

  public readonly divisibleBy: number[];

  // PureSchema Field Overrides

  public override readonly schemaType = 'restrictedNumber';

  public override readonly valueType = undefined as any as number;

  public override readonly estimatedValidationTimeComplexity: number;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = false;

  public override get usesCustomSerDes() {
    return this.usesCustomSerDes_;
  }

  public override readonly isContainerType = false;

  // Private Fields

  private readonly allowedNumbersSet_: Set<number>;

  private readonly allowedRanges_: Array<Range<number>>;

  private usesCustomSerDes_ = false;

  // Initialization

  constructor(allowedValuesAndRanges: Array<number | Range<number>>, { divisibleBy = [] }: RestrictedNumberOptions = {}) {
    super();

    this.allowedValuesAndRanges = allowedValuesAndRanges;
    this.divisibleBy = divisibleBy;

    const allowedNumbers = allowedValuesAndRanges.filter((v): v is number => typeof v === 'number');
    this.allowedNumbersSet_ = new Set(allowedNumbers);

    this.allowedRanges_ = allowedValuesAndRanges.filter((v): v is Range<number> => typeof v !== 'number');

    this.estimatedValidationTimeComplexity = this.allowedRanges_.length + 1;
  }

  // Public Methods

  public readonly clone = (): RestrictedNumberSchema =>
    copyMetaFields({
      from: this,
      to: restrictedNumber(this.allowedValuesAndRanges, { divisibleBy: this.divisibleBy }).setAllowedSerializationForms(
        this.allowedSerializationForms
      )
    });

  public readonly setAllowedSerializationForms = (allowed?: Array<'number' | 'string'>): this => {
    if (allowed === undefined || allowed.length === 0 || (allowed.length === 1 && allowed[0] === 'number')) {
      this.allowedSerializationForms = undefined;
      this.usesCustomSerDes_ = false;
    } else {
      this.allowedSerializationForms = allowed;
      this.usesCustomSerDes_ = true;
    }

    return this;
  };

  // Method Overrides

  protected override overridableInternalValidate = supportVariableSerializationFormsForNumericValues(
    () => this,
    (value, _validatorOptions, path, container, validationMode) => {
      if (typeof value !== 'number') {
        return makeErrorResultForValidationMode(
          cloner(value),
          validationMode,
          () => `Expected number, found ${getMeaningfulTypeof(value)}`,
          path
        );
      }

      if (validationMode === 'none') {
        return makeNoError(value);
      }

      if (Number.isNaN(value)) {
        return makeErrorResultForValidationMode(
          () => value,
          validationMode,
          () => 'Found NaN',
          path
        );
      } else if (!Number.isFinite(value)) {
        return makeErrorResultForValidationMode(
          () => value,
          validationMode,
          () => 'Found non-finite value',
          path
        );
      }

      if (this.allowedNumbersSet_.size > 0) {
        const valueResult = validateValue(value, { allowed: this.allowedNumbersSet_, path, validationMode });
        if (isErrorResult(valueResult)) {
          if (this.allowedRanges_.length > 0) {
            const rangeResult = validateValueInRange(value, { allowed: this.allowedRanges_, path, validationMode });
            if (isErrorResult(rangeResult)) {
              return rangeResult;
            }
          } else {
            return valueResult;
          }
        }
      } else if (this.allowedRanges_.length > 0) {
        const rangeResult = validateValueInRange(value, { allowed: this.allowedRanges_, path, validationMode });
        if (isErrorResult(rangeResult)) {
          return rangeResult;
        }
      }

      if (this.divisibleBy.length > 0) {
        return validateValueIsDivisibleBy(value, { allowed: this.divisibleBy }, path, container, validationMode);
      }

      return makeNoError(value);
    }
  );

  protected override overridableInternalValidateAsync = undefined;

  protected override overridableGetExtraToStringFields = () => ({
    allowedValuesAndRanges: this.allowedValuesAndRanges,
    divisibleBy: this.divisibleBy
  });
}
