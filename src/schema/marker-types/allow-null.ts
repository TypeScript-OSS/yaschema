import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type { InternalAsyncValidator, InternalValidator } from '../internal/types/internal-validation';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';

/** Requires that either the specified schema is satisfied or that the value is `null`. */
export interface AllowNullSchema<NonNullValueT> extends Schema<NonNullValueT | null> {
  schemaType: 'allowNull';
  clone: () => AllowNullSchema<NonNullValueT>;

  schema: Schema<NonNullValueT>;
}

/** Requires that either the specified schema is satisfied or that the value is `null`. */
export const allowNull = <NonNullValueT>(schema: Schema<NonNullValueT>): AllowNullSchema<NonNullValueT> => {
  const internalValidate: InternalValidator = (value, validatorOptions, path) => {
    if (value === null) {
      return noError;
    }

    return (schema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
  };
  const internalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) => {
    if (value === null) {
      return noError;
    }

    return (schema as any as InternalSchemaFunctions).internalValidateAsync(value, validatorOptions, path);
  };

  const fullSchema: AllowNullSchema<NonNullValueT> = makeInternalSchema(
    {
      valueType: undefined as any as NonNullValueT | null,
      schemaType: 'allowNull',
      clone: () => copyMetaFields({ from: fullSchema, to: allowNull(fullSchema.schema) }),
      schema,
      estimatedValidationTimeComplexity: schema.estimatedValidationTimeComplexity,
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval,
      usesCustomSerDes: schema.usesCustomSerDes
    },
    { internalValidate, internalValidateAsync }
  );

  return fullSchema;
};
