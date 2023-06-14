import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { InternalSchemaMakerImpl } from '../internal/internal-schema-maker-impl';
import { cloner } from '../internal/utils/cloner';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { isErrorResult } from '../internal/utils/is-error-result';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';
import { makeNoError } from '../internal/utils/make-no-error';
import { supportVariableSerializationFormsForNumericValues } from '../internal/utils/support-variable-serialization-forms-for-numeric-values';
import { validateValue } from '../internal/utils/validate-value';

/** Requires a real, finite number, optionally matching one of the specified values. */
export interface NumberSchema<ValueT extends number> extends Schema<ValueT> {
  schemaType: 'number';
  clone: () => NumberSchema<ValueT>;

  allowedValues: ValueT[];

  /**
   * For serialization, the first type will be used. `['number']` is assumed if nothing is specified.
   *
   * For deserialization, forms are tried in order.
   */
  allowedSerializationForms?: Array<'number' | 'string'>;
  /** Sets (replaces) the allowed serialization forms metadata for this schema and returns the same schema */
  setAllowedSerializationForms: (allowed?: Array<'number' | 'string'>) => this;
}

/** Requires a real, finite number.  If one or more values are specified, the value must also be equal to one of the specified values */
export const number = <ValueT extends number>(...allowedValues: ValueT[]): NumberSchema<ValueT> => new NumberSchemaImpl(...allowedValues);

// Helpers

class NumberSchemaImpl<ValueT extends number> extends InternalSchemaMakerImpl<ValueT> implements NumberSchema<ValueT> {
  // Public Fields

  public readonly allowedValues: ValueT[];

  public allowedSerializationForms?: Array<'number' | 'string'>;

  // PureSchema Field Overrides

  public override readonly schemaType = 'number';

  public override readonly valueType = undefined as any as ValueT;

  public override readonly estimatedValidationTimeComplexity = 1;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = false;

  public override get usesCustomSerDes() {
    return this.usesCustomSerDes_;
  }

  public override readonly isContainerType = false;

  // Private Fields

  private readonly equalsNumbersSet_: Set<number>;

  private usesCustomSerDes_ = false;

  // Initialization

  constructor(...allowedValues: ValueT[]) {
    super();

    this.allowedValues = allowedValues;
    this.equalsNumbersSet_ = new Set(allowedValues);
  }

  // Public Methods

  public readonly clone = (): NumberSchema<ValueT> =>
    copyMetaFields({
      from: this,
      to: new NumberSchemaImpl(...this.allowedValues).setAllowedSerializationForms(this.allowedSerializationForms)
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
    (value, _validatorOptions, path, _container, validationMode) => {
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

      if (this.equalsNumbersSet_.size > 0) {
        const result = validateValue(value, { allowed: this.equalsNumbersSet_, path, validationMode });
        if (isErrorResult(result)) {
          return result;
        }
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
