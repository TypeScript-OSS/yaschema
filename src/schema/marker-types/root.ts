import type { Schema } from '../../types/schema';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';

/** A special marker schema for named types, useful for code generation tools. */
export interface RootSchema<ValueT> extends Schema<ValueT> {
  schemaType: 'root';
  name: string;
  schema: Schema<ValueT>;
}

/**
 * Requires the specified schema but marks this as a type that can be referenced by name.
 *
 * This is most useful when using automatic code generation tools.
 */
export const root = <ValueT>(name: string, schema: Schema<ValueT>): RootSchema<ValueT> => {
  const internalValidate = (schema as any as InternalSchemaFunctions).internalValidate;
  const internalValidateAsync = (schema as any as InternalSchemaFunctions).internalValidateAsync;

  return makeInternalSchema(
    {
      valueType: undefined as any as ValueT,
      schemaType: 'root',
      name,
      schema,
      estimatedValidationTimeComplexity: schema.estimatedValidationTimeComplexity,
      usesCustomSerDes: schema.usesCustomSerDes
    },
    { internalValidate, internalValidateAsync }
  );
};
