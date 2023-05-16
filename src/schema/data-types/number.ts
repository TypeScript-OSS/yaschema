import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalValidator } from '../internal/types/internal-validation';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { getValidationMode } from '../internal/utils/get-validation-mode';
import { isErrorResult } from '../internal/utils/is-error-result';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';
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
export const number = <ValueT extends number>(...allowedValues: ValueT[]): NumberSchema<ValueT> => {
  const equalsNumbers = allowedValues.filter((v): v is ValueT => typeof v === 'number');

  const equalsNumbersSet = new Set(equalsNumbers);

  const internalValidate: InternalValidator = supportVariableSerializationFormsForNumericValues(
    () => fullSchema,
    (value, validatorOptions, path) => {
      const validationMode = getValidationMode(validatorOptions);

      if (typeof value !== 'number') {
        return makeErrorResultForValidationMode(validationMode, () => `Expected number, found ${getMeaningfulTypeof(value)}`, path);
      }

      if (getValidationMode(validatorOptions) === 'none') {
        return noError;
      }

      if (Number.isNaN(value)) {
        return makeErrorResultForValidationMode(validationMode, () => 'Found NaN', path);
      } else if (!Number.isFinite(value)) {
        return makeErrorResultForValidationMode(validationMode, () => 'Found non-finite value', path);
      }

      if (equalsNumbers.length > 0) {
        const result = validateValue(value, { allowed: equalsNumbersSet, path, validationMode });
        if (isErrorResult(result)) {
          return result;
        }
      }

      return noError;
    }
  );

  const fullSchema: NumberSchema<ValueT> = makeInternalSchema(
    {
      valueType: undefined as any as ValueT,
      schemaType: 'number',
      clone: () =>
        copyMetaFields({
          from: fullSchema,
          to: number(...fullSchema.allowedValues).setAllowedSerializationForms(fullSchema.allowedSerializationForms)
        }),
      allowedValues,
      estimatedValidationTimeComplexity: allowedValues.length + 1,
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: false,
      usesCustomSerDes: false,
      setAllowedSerializationForms: (allowed?: Array<'number' | 'string'>) => {
        if (allowed === undefined || allowed.length === 0 || (allowed.length === 1 && allowed[0] === 'number')) {
          fullSchema.allowedSerializationForms = undefined;
          fullSchema.usesCustomSerDes = false;
        } else {
          fullSchema.allowedSerializationForms = allowed;
          fullSchema.usesCustomSerDes = true;
        }

        return fullSchema;
      }
    },
    { internalValidate }
  );

  return fullSchema;
};
