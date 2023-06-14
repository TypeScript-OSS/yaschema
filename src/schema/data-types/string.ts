import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { InternalSchemaMakerImpl } from '../internal/internal-schema-maker-impl';
import type { InternalValidator } from '../internal/types/internal-validation';
import { cloner } from '../internal/utils/cloner';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';
import { makeNoError } from '../internal/utils/make-no-error';
import { validateValue } from '../internal/utils/validate-value';
import type { AllowEmptyStringSchema } from './allow-empty-string';
import { allowEmptyString } from './allow-empty-string';

/** Requires a non-empty string, optionally matching one of the specified values. */
export interface StringSchema<ValueT extends string> extends Schema<ValueT> {
  schemaType: 'string';
  clone: () => StringSchema<ValueT>;

  allowedValues: ValueT[];
  allowEmptyString: () => AllowEmptyStringSchema<ValueT>;
}

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

  // PureSchema Field Overrides

  public override readonly schemaType = 'string';

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
  }

  // Public Methods

  public readonly allowEmptyString = () => allowEmptyString(...this.allowedValues);

  public readonly clone = (): StringSchema<ValueT> => copyMetaFields({ from: this, to: new StringSchemaImpl(...this.allowedValues) });

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

    if (validationMode === 'none') {
      return makeNoError(value);
    }

    if (this.allowedValues.length > 0) {
      return validateValue(value, { allowed: this.equalsSet_, path, validationMode });
    }

    if (value.length === 0) {
      return makeErrorResultForValidationMode(
        () => value,
        validationMode,
        () => 'Expected non-empty string, found empty string',
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
