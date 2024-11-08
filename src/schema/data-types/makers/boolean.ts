import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof.js';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl/index.js';
import type { InternalValidationResult } from '../../internal/types/internal-validation';
import { cloner } from '../../internal/utils/cloner.js';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields.js';
import { makeErrorResultForValidationMode } from '../../internal/utils/make-error-result-for-validation-mode.js';
import { makeNoError } from '../../internal/utils/make-no-error.js';
import { supportVariableSerializationFormsForBooleanValues } from '../../internal/utils/support-variable-serialization-forms-for-boolean-values.js';
import { validateValue } from '../../internal/utils/validate-value.js';
import type { BooleanSchema } from '../types/BooleanSchema';

/** Requires a boolean.  If one or more values are specified, the boolean must also match one of the specified values. */
export const boolean = <ValueT extends boolean>(...allowedValues: ValueT[]): BooleanSchema<ValueT> =>
  new BooleanSchemaImpl(...allowedValues);

// Helpers

class BooleanSchemaImpl<ValueT extends boolean> extends InternalSchemaMakerImpl<ValueT> implements BooleanSchema<ValueT> {
  // Public Fields

  public readonly allowedValues: ValueT[];

  public allowedSerializationForms?: Array<'boolean' | 'string'>;

  // PureSchema Field Overrides

  public override readonly schemaType = 'boolean';

  public override readonly valueType = undefined as any as ValueT;

  public override readonly estimatedValidationTimeComplexity = 1;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = false;

  public override get usesCustomSerDes() {
    return this.usesCustomSerDes_;
  }

  public override readonly isContainerType = false;

  // Private Fields

  private readonly equalsSet_: Set<ValueT>;
  private usesCustomSerDes_ = false;

  // Initialization

  constructor(...allowedValues: ValueT[]) {
    super();

    this.allowedValues = allowedValues;
    this.equalsSet_ = new Set(allowedValues);
  }

  // Public Methods

  public readonly clone = (): BooleanSchema<ValueT> =>
    copyMetaFields({
      from: this,
      to: new BooleanSchemaImpl(...this.allowedValues).setAllowedSerializationForms(this.allowedSerializationForms)
    });

  public readonly setAllowedSerializationForms = (allowed?: Array<'boolean' | 'string'>): this => {
    if (allowed === undefined || allowed.length === 0 || (allowed.length === 1 && allowed[0] === 'boolean')) {
      this.allowedSerializationForms = undefined;
      this.usesCustomSerDes_ = false;
    } else {
      this.allowedSerializationForms = allowed;
      this.usesCustomSerDes_ = true;
    }

    return this;
  };

  // Method Overrides

  protected override overridableInternalValidateAsync = supportVariableSerializationFormsForBooleanValues(
    () => this,
    (value, _validatorOptions, path, _container, validationMode): InternalValidationResult => {
      if (typeof value !== 'boolean') {
        return makeErrorResultForValidationMode(
          cloner(value),
          validationMode,
          () => `Expected boolean, found ${getMeaningfulTypeof(value)}`,
          path
        );
      }

      if (validationMode === 'none') {
        return makeNoError(value);
      }

      if (this.allowedValues.length > 0) {
        return validateValue(value, { allowed: this.equalsSet_, path, validationMode });
      }

      return makeNoError(value);
    }
  );

  protected override overridableGetExtraToStringFields = () => ({
    allowedValues: this.allowedValues,
    allowedSerializationForms: this.allowedSerializationForms
  });
}
