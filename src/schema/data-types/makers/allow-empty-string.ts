import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl';
import type { InternalValidator } from '../../internal/types/internal-validation';
import { cloner } from '../../internal/utils/cloner';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields';
import { makeErrorResultForValidationMode } from '../../internal/utils/make-error-result-for-validation-mode';
import { makeNoError } from '../../internal/utils/make-no-error';
import { validateValue } from '../../internal/utils/validate-value';
import type { AllowEmptyStringSchema } from '../types/AllowEmptyStringSchema';

/**
 * Requires a string, which may be empty.  If one or more values are specified, the string must either be empty or match ones of the
 * specified values.
 */
export const allowEmptyString = <ValueT extends string>(...allowedValues: ValueT[]): AllowEmptyStringSchema<ValueT> =>
  new AllowEmptyStringSchemaImpl(...allowedValues);

// Helpers

class AllowEmptyStringSchemaImpl<ValueT extends string>
  extends InternalSchemaMakerImpl<ValueT | ''>
  implements AllowEmptyStringSchema<ValueT>
{
  // Public Fields

  public readonly allowedValues: ValueT[];

  public minLength: number | undefined;

  public maxLength: number | undefined;

  // PureSchema Field Overrides

  public override readonly schemaType = 'allowEmptyString';

  public override readonly valueType = undefined as any as ValueT;

  public override readonly estimatedValidationTimeComplexity = 1;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = false;

  public override readonly usesCustomSerDes = false;

  public override readonly isContainerType = false;

  // Private Fields

  private readonly equalsSet_: Set<ValueT>;

  // Initialization

  constructor(...allowedValues: ValueT[]) {
    super();

    this.allowedValues = allowedValues;
    this.equalsSet_ = new Set(allowedValues);
    this.minLength = 1;
    this.maxLength = undefined;
  }

  // Public Methods

  public readonly clone = (): AllowEmptyStringSchema<ValueT> =>
    copyMetaFields({
      from: this,
      to: new AllowEmptyStringSchemaImpl(...this.allowedValues).setAllowedLengthRange(this.minLength, this.maxLength)
    });

  public readonly setAllowedLengthRange = (minLength: number | undefined, maxLength: number | undefined): this => {
    this.minLength = minLength;
    this.maxLength = maxLength;
    return this;
  };

  // Method Overrides

  protected override overridableInternalValidate: InternalValidator = (value, _validatorOptions, path, _container, validationMode) => {
    if (typeof value !== 'string') {
      return makeErrorResultForValidationMode(
        cloner(value),
        validationMode,
        () => `Expected string, found ${getMeaningfulTypeof(value)}`,
        path
      );
    }

    if (value === '') {
      return makeNoError('');
    }

    if (this.allowedValues.length > 0) {
      return validateValue(value, { allowed: this.equalsSet_, path, validationMode });
    }

    const length = value.length;

    if (this.minLength !== undefined && length < this.minLength) {
      return makeErrorResultForValidationMode(
        () => value,
        validationMode,
        () => `Expected at least ${this.minLength} characters in string, got ${length} characters`,
        path
      );
    } else if (this.maxLength !== undefined && length > this.maxLength) {
      return makeErrorResultForValidationMode(
        () => value,
        validationMode,
        () => `Expected at most ${this.maxLength} characters in string, got ${length} characters`,
        path
      );
    }

    return makeNoError(value);
  };

  protected override overridableInternalValidateAsync = undefined;

  protected override overridableGetExtraToStringFields = () => ({
    allowedValues: this.allowedValues
  });
}
