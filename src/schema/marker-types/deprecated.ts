import { getLogger } from '../../config/logging';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type { InternalAsyncValidator, InternalValidator } from '../internal/types/internal-validation';

const alreadyLogDeprecationWarnings = new Set<string>();

/** Requires either `undefined` or the specified schema to be satisfied. */
export interface DeprecatedSchema<ValueT> extends Schema<ValueT> {
  schemaType: 'deprecated';
  schema: Schema<ValueT>;
  deadline?: string;
  uniqueName: string;
}

/**
 * Requires either `undefined` or the specified schema to be satisfied.  However, if the specified schema is satisfied, a warning is logged
 * (once per `uniqueName` per runtime instance).
 *
 * @see `setLogger`
 */
export const deprecated = <ValueT>(
  uniqueName: string,
  schema: Schema<ValueT>,
  { deadline }: { deadline?: string } = {}
): DeprecatedSchema<ValueT> => {
  const internalValidate: InternalValidator = (value, validatorOptions, path) => {
    if (value === undefined) {
      return noError;
    }

    const result = (schema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
    if (result.error !== undefined) {
      return result;
    }

    if (value !== undefined && !alreadyLogDeprecationWarnings.has(uniqueName)) {
      alreadyLogDeprecationWarnings.add(uniqueName);
      getLogger().warn?.(
        `[DEPRECATION] ${uniqueName} is deprecated and will be removed ${deadline ? `after ${deadline}` : 'soon'}.`,
        'debug'
      );
    }

    return noError;
  };
  const internalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) => {
    if (value === undefined) {
      return noError;
    }

    const result = await (schema as any as InternalSchemaFunctions).internalValidateAsync(value, validatorOptions, path);
    if (result.error !== undefined) {
      return result;
    }

    if (value !== undefined && !alreadyLogDeprecationWarnings.has(uniqueName)) {
      alreadyLogDeprecationWarnings.add(uniqueName);
      getLogger().warn?.(
        `[DEPRECATION] ${uniqueName} is deprecated and will be removed ${deadline ? `after ${deadline}` : 'soon'}.`,
        'debug'
      );
    }

    return noError;
  };

  return makeInternalSchema(
    {
      valueType: undefined as any as ValueT,
      schemaType: 'deprecated',
      schema,
      deadline,
      uniqueName,
      estimatedValidationTimeComplexity: schema.estimatedValidationTimeComplexity,
      usesCustomSerDes: schema.usesCustomSerDes
    },
    { internalValidate, internalValidateAsync }
  );
};
