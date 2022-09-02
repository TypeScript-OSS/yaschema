import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type { InternalAsyncValidator, InternalValidator } from '../internal/types/internal-validation';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { getValidationMode } from '../internal/utils/get-validation-mode';
import { isErrorResult } from '../internal/utils/is-error-result';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';

/** Requires the first specified schema but the second cannot be satisfied. */
export interface NotSchema<ValueT, ExcludedT> extends Schema<Exclude<ValueT, ExcludedT>> {
  schemaType: 'not';
  clone: () => NotSchema<ValueT, ExcludedT>;

  schema: Schema<ValueT>;
  notSchema: Schema<ExcludedT>;
  expectedTypeName?: string;
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
  { expectedTypeName }: { expectedTypeName?: string } = {}
): NotSchema<ValueT, ExcludedT> => {
  const internalValidate: InternalValidator = (value, validatorOptions, path) => {
    const result = (notSchema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
    if (!isErrorResult(result)) {
      const validationMode = getValidationMode(validatorOptions);

      return makeErrorResultForValidationMode(
        validationMode,
        () =>
          expectedTypeName !== undefined
            ? `Expected ${expectedTypeName}, found ${getMeaningfulTypeof(value)}`
            : `Encountered an unsupported value, found ${getMeaningfulTypeof(value)}`,
        path
      );
    }

    return (schema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
  };
  const internalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) => {
    const result = await (notSchema as any as InternalSchemaFunctions).internalValidateAsync(value, validatorOptions, path);
    if (!isErrorResult(result)) {
      const validationMode = getValidationMode(validatorOptions);

      return makeErrorResultForValidationMode(
        validationMode,
        () =>
          expectedTypeName !== undefined
            ? `Expected ${expectedTypeName}, found ${getMeaningfulTypeof(value)}`
            : `Encountered an unsupported value, found ${getMeaningfulTypeof(value)}`,
        path
      );
    }

    return (schema as any as InternalSchemaFunctions).internalValidateAsync(value, validatorOptions, path);
  };

  const fullSchema: NotSchema<ValueT, ExcludedT> = makeInternalSchema(
    {
      valueType: undefined as any as Exclude<ValueT, ExcludedT>,
      schemaType: 'not',
      clone: () =>
        copyMetaFields({
          from: fullSchema,
          to: not(fullSchema.schema, fullSchema.notSchema, { expectedTypeName: fullSchema.expectedTypeName })
        }),
      schema,
      notSchema,
      expectedTypeName,
      estimatedValidationTimeComplexity: notSchema.estimatedValidationTimeComplexity,
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: notSchema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval,
      usesCustomSerDes: notSchema.usesCustomSerDes
    },
    { internalValidate, internalValidateAsync }
  );

  return fullSchema;
};
