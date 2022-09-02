import type { Schema } from '../../types/schema';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type { InternalAsyncValidator, InternalValidator } from '../internal/types/internal-validation';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';

/** Requires that either the specified schema is satisfied or that the value is `undefined`. */
export interface OptionalSchema<DefinedValueT> extends Schema<DefinedValueT | undefined> {
  schemaType: 'optional';
  clone: () => OptionalSchema<DefinedValueT>;

  schema: Schema<DefinedValueT>;
}

/** Requires that either the specified schema is satisfied or that the value is `undefined`. */
export const optional = <DefinedValueT>(schema: Schema<DefinedValueT>): OptionalSchema<DefinedValueT> => {
  const internalValidate: InternalValidator = (value, validatorOptions, path) =>
    value === undefined ? {} : (schema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
  const internalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) =>
    value === undefined ? {} : (schema as any as InternalSchemaFunctions).internalValidateAsync(value, validatorOptions, path);

  const fullSchema: OptionalSchema<DefinedValueT> = makeInternalSchema(
    {
      valueType: undefined as any as DefinedValueT | undefined,
      schemaType: 'optional',
      clone: () => copyMetaFields({ from: fullSchema, to: optional(fullSchema.schema) }),
      schema,
      estimatedValidationTimeComplexity: schema.estimatedValidationTimeComplexity,
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval,
      usesCustomSerDes: schema.usesCustomSerDes
    },
    { internalValidate, internalValidateAsync }
  );

  return fullSchema;
};
