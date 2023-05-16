import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type { InternalValidator } from '../internal/types/internal-validation';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { getValidationMode } from '../internal/utils/get-validation-mode';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';
import { validateValue } from '../internal/utils/validate-value';

/** Requires any string.  */
export interface AllowEmptyStringSchema<ValueT extends string> extends Schema<ValueT | ''> {
  schemaType: 'allowEmptyString';
  clone: () => AllowEmptyStringSchema<ValueT>;

  schema: Schema<ValueT>;
}

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
export const string = <ValueT extends string>(...allowedValues: ValueT[]): StringSchema<ValueT> => {
  const equalsSet = new Set(allowedValues);

  const internalValidate: InternalValidator = (value, validatorOptions, path) => {
    const validationMode = getValidationMode(validatorOptions);

    if (typeof value !== 'string') {
      return makeErrorResultForValidationMode(validationMode, () => `Expected string, found ${getMeaningfulTypeof(value)}`, path);
    }

    if (validationMode === 'none') {
      return noError;
    }

    if (allowedValues.length > 0) {
      return validateValue(value, { allowed: equalsSet, path, validationMode });
    }

    if (value.length === 0) {
      return makeErrorResultForValidationMode(validationMode, () => 'Expected non-empty string, found empty string', path);
    }

    return noError;
  };

  const fullSchema: StringSchema<ValueT> = makeInternalSchema(
    {
      valueType: undefined as any as ValueT,
      schemaType: 'string' as const,
      clone: () => copyMetaFields({ from: fullSchema, to: string(...fullSchema.allowedValues) }),
      allowedValues,
      estimatedValidationTimeComplexity: allowedValues.length + 1,
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: false,
      usesCustomSerDes: false,
      allowEmptyString: () => allowEmptyString(fullSchema)
    },
    { internalValidate }
  );

  return fullSchema;
};

// Helpers

const allowEmptyString = <ValueT extends string>(schema: Schema<ValueT>): AllowEmptyStringSchema<ValueT> => {
  const internalValidate: InternalValidator = (value, validatorOptions, path) => {
    if (value === '') {
      return noError;
    }

    return (schema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
  };

  const fullSchema: AllowEmptyStringSchema<ValueT> = makeInternalSchema(
    {
      valueType: undefined as any as ValueT | '',
      schemaType: 'allowEmptyString',
      clone: () => copyMetaFields({ from: fullSchema, to: allowEmptyString(fullSchema.schema) }),
      schema,
      estimatedValidationTimeComplexity: 1,
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: false,
      usesCustomSerDes: false
    },
    { internalValidate }
  );

  return fullSchema;
};
