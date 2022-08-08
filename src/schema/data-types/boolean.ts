import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalValidator } from '../internal/types/internal-validation';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { atPath } from '../internal/utils/path-utils';
import { supportVariableSerializationFormsForBooleanValues } from '../internal/utils/support-variable-serialization-forms-for-boolean-values';
import { validateValue } from '../internal/utils/validate-value';

// TODO: add option for serializedAsString

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
export const boolean = <ValueT extends boolean>(...allowedValues: ValueT[]): BooleanSchema<ValueT> => {
  const equalsSet = new Set(allowedValues);

  const internalValidate: InternalValidator = supportVariableSerializationFormsForBooleanValues(
    () => fullSchema,
    (value, validatorOptions, path) => {
      if (typeof value !== 'boolean') {
        return { error: () => `Expected boolean, found ${getMeaningfulTypeof(value)}${atPath(path)}` };
      }

      if (validatorOptions.validation === 'none') {
        return noError;
      }

      if (allowedValues.length > 0) {
        return validateValue(value, { allowed: equalsSet, path });
      }

      return noError;
    }
  );

  const fullSchema: BooleanSchema<ValueT> = makeInternalSchema(
    {
      valueType: undefined as any as ValueT,
      schemaType: 'boolean',
      clone: () =>
        copyMetaFields({
          from: fullSchema,
          to: boolean(...fullSchema.allowedValues).setAllowedSerializationForms(fullSchema.allowedSerializationForms)
        }),
      allowedValues,
      estimatedValidationTimeComplexity: 1,
      usesCustomSerDes: false,
      setAllowedSerializationForms: (allowed?: Array<'boolean' | 'string'>) => {
        if (allowed === undefined || allowed.length === 0 || (allowed.length === 1 && allowed[0] === 'boolean')) {
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
