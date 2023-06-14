import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { InternalSchemaMakerImpl } from '../internal/internal-schema-maker-impl';
import type { InternalValidationResult } from '../internal/types/internal-validation';
import { cloner } from '../internal/utils/cloner';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';
import { makeNoError } from '../internal/utils/make-no-error';
import { supportVariableSerializationFormsForBooleanValues } from '../internal/utils/support-variable-serialization-forms-for-boolean-values';
import { validateValue } from '../internal/utils/validate-value';

/** Requires a boolean, optionally matching one of the specified values. */
export interface BooleanSchema<ValueT extends boolean> extends Schema<ValueT> {
  schemaType: 'boolean';
  clone: () => BooleanSchema<ValueT>;

  allowedValues: ValueT[];

  /**
   * For serialization, the first type will be used. `['boolean']` is assumed if nothing is specified.
   *
   * For deserialization, forms are tried in order.
   */
  allowedSerializationForms?: Array<'boolean' | 'string'>;
  /** Sets (replaces) the allowed serialization forms metadata for this schema and returns the same schema */
  setAllowedSerializationForms: (allowed?: Array<'boolean' | 'string'>) => this;
}

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

  protected override overridableInternalValidate = supportVariableSerializationFormsForBooleanValues(
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

  protected override overridableInternalValidateAsync = undefined;

  protected override overridableGetExtraToStringFields = () => ({
    allowedValues: this.allowedValues,
    allowedSerializationForms: this.allowedSerializationForms
  });
}
