import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { InternalSchemaMakerImpl } from '../internal/internal-schema-maker-impl';
import type { InternalValidator } from '../internal/types/internal-validation';
import { cloner } from '../internal/utils/cloner';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';
import { makeNoError } from '../internal/utils/make-no-error';
import { validateValue } from '../internal/utils/validate-value';

/** Requires a string, optionally matching one of the specified values. */
export interface AllowEmptyStringSchema<ValueT extends string> extends Schema<ValueT | ''> {
  readonly schemaType: 'allowEmptyString';
  readonly clone: () => AllowEmptyStringSchema<ValueT>;

  /** Note that this doesn't include `''` */
  readonly allowedValues: ValueT[];
}

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
  }

  // Public Methods

  public readonly clone = (): AllowEmptyStringSchema<ValueT> =>
    copyMetaFields({ from: this, to: new AllowEmptyStringSchemaImpl(...this.allowedValues) });

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

    return makeNoError(value);
  };

  protected override overridableInternalValidateAsync = undefined;

  protected override overridableGetExtraToStringFields = () => ({
    allowedValues: this.allowedValues
  });
}
