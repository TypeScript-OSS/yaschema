import type { CommonSchemaOptions } from '../../types/common-schema-options';
import type { Schema } from '../../types/schema';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type { InternalAsyncValidator, InternalValidator } from '../internal/types/internal-validation';

/** Requires that either the specified schema is satisfied or that the value is `undefined`. */
export interface OptionalSchema<DefinedValueT> extends Schema<DefinedValueT | undefined> {
  schemaType: 'optional';
  schema: Schema<DefinedValueT>;
}

/** Requires that either the specified schema is satisfied or that the value is `undefined`. */
export const optional = <DefinedValueT>(
  schema: Schema<DefinedValueT>,
  options: CommonSchemaOptions = {}
): OptionalSchema<DefinedValueT> => {
  const internalValidate: InternalValidator = (value, validatorOptions, path) =>
    value === undefined ? {} : (schema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
  const internalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) =>
    value === undefined ? {} : (schema as any as InternalSchemaFunctions).internalValidateAsync(value, validatorOptions, path);

  return makeInternalSchema(
    {
      valueType: undefined as any as DefinedValueT | undefined,
      schemaType: 'optional',
      schema,
      ...options,
      estimatedValidationTimeComplexity: schema.estimatedValidationTimeComplexity,
      usesCustomSerDes: schema.usesCustomSerDes
    },
    { internalValidate, internalValidateAsync }
  );
};
