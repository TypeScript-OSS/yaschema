import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { CommonSchemaOptions } from '../internal/types/common-schema-options';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type { InternalAsyncValidator, InternalValidator } from '../internal/types/internal-validation';
import { atPath } from '../internal/utils/path-utils';

/** Requires the first specified schema but the second cannot be satisfied. */
export interface NotSchema<ValueT, ExcludedT> extends Schema<Exclude<ValueT, ExcludedT>> {
  schemaType: 'not';
  schema: Schema<ValueT>;
  notSchema: Schema<ExcludedT>;
}

/**
 * Requires the first specified schema but the second cannot be satisfied.
 *
 * Note that the TypeScript compiler may not compute a useful exclusion type in some cases.  For example, if `ValueT` is `string` and
 * `ExcludedT` is `'hello'`, the compile-time type of this schemas `valueType` field will be `string` since `Exclude<string, 'hello'>` is
 * still `string`.  However, runtime validation will still be performed as expected, allowing, for example, any string except `'hello'`.
 */
export const not = <ValueT, ExcludedT>(
  schema: Schema<ValueT>,
  notSchema: Schema<ExcludedT>,
  options: CommonSchemaOptions & { expectedTypeName?: string } = {}
): NotSchema<ValueT, ExcludedT> => {
  const internalValidate: InternalValidator = (value, validatorOptions, path) => {
    if ((notSchema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path).error === undefined) {
      return {
        error: () =>
          options.expectedTypeName !== undefined
            ? `Expected ${options.expectedTypeName}, found ${getMeaningfulTypeof(value)}${atPath(path)}`
            : `Encountered an unsupported value, found ${getMeaningfulTypeof(value)}${atPath(path)}`
      };
    }

    return (schema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
  };
  const internalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) => {
    if ((await (notSchema as any as InternalSchemaFunctions).internalValidateAsync(value, validatorOptions, path)).error === undefined) {
      return {
        error: () =>
          options.expectedTypeName !== undefined
            ? `Expected ${options.expectedTypeName}, found ${getMeaningfulTypeof(value)}${atPath(path)}`
            : `Encountered an unsupported value, found ${getMeaningfulTypeof(value)}${atPath(path)}`
      };
    }

    return (schema as any as InternalSchemaFunctions).internalValidateAsync(value, validatorOptions, path);
  };

  return makeInternalSchema(
    {
      valueType: undefined as any as Exclude<ValueT, ExcludedT>,
      schemaType: 'not',
      schema,
      notSchema,
      ...options,
      estimatedValidationTimeComplexity: notSchema.estimatedValidationTimeComplexity,
      usesCustomSerDes: notSchema.usesCustomSerDes
    },
    { internalValidate, internalValidateAsync }
  );
};
