import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof.js';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl/index.js';
import type { InternalAsyncValidator } from '../../internal/types/internal-validation.js';
import { cloner } from '../../internal/utils/cloner.js';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields.js';
import { makeErrorResultForValidationMode } from '../../internal/utils/make-error-result-for-validation-mode.js';
import { makeNoError } from '../../internal/utils/make-no-error.js';
import { validateValue } from '../../internal/utils/validate-value.js';
import type { StringSchema } from '../types/StringSchema';
import { allowEmptyString } from './allow-empty-string.js';

/**
 * Requires a non-empty string.  If one or more values are specified, the string must match ones of the specified values.
 *
 * Call `.allowEmptyString` to allow empty strings.
 */
export const string = <ValueT extends string>(...allowedValues: ValueT[]): StringSchema<ValueT> => new StringSchemaImpl(...allowedValues);

// Helpers

class StringSchemaImpl<ValueT extends string> extends InternalSchemaMakerImpl<ValueT> implements StringSchema<ValueT> {
  // Public Fields

  public readonly allowedValues: ValueT[];

  public minLength: number | undefined;

  public maxLength: number | undefined;

  // PureSchema Field Overrides

  public override readonly schemaType = 'string';

  public override readonly valueType = undefined as any as ValueT;

  public override readonly estimatedValidationTimeComplexity = () => 1;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = () => false;

  public override readonly usesCustomSerDes = () => false;

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

  public readonly allowEmptyString = () => allowEmptyString(...this.allowedValues);

  public readonly clone = (): StringSchema<ValueT> =>
    copyMetaFields({ from: this, to: new StringSchemaImpl(...this.allowedValues).setAllowedLengthRange(this.minLength, this.maxLength) });

  public readonly setAllowedLengthRange = (minLength: number | undefined, maxLength: number | undefined): this => {
    this.minLength = minLength;
    this.maxLength = maxLength;
    return this;
  };

  // Method Overrides

  protected override overridableInternalValidateAsync: InternalAsyncValidator = (
    value,
    _validatorOptions,
    path,
    _container,
    validationMode
  ) => {
    if (typeof value !== 'string') {
      return makeErrorResultForValidationMode(
        cloner(value),
        validationMode,
        () => `Expected string, found ${getMeaningfulTypeof(value)}`,
        path
      );
    }

    if (validationMode === 'none') {
      return makeNoError(value);
    }

    if (this.allowedValues.length > 0) {
      return validateValue(value, { allowed: this.equalsSet_, path, validationMode });
    }

    const length = value.length;

    if (this.minLength !== undefined && length < this.minLength) {
      if (length === 0) {
        return makeErrorResultForValidationMode(
          () => value,
          validationMode,
          () => 'Expected non-empty string, found empty string',
          path
        );
      } else {
        return makeErrorResultForValidationMode(
          () => value,
          validationMode,
          () => `Expected at least ${this.minLength} characters in string, got ${length} characters`,
          path
        );
      }
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

  protected override overridableGetExtraToStringFields = () => ({
    allowedValues: this.allowedValues
  });
}
