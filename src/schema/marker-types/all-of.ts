import { getAsyncTimeComplexityThreshold } from '../../config/async-time-complexity-threshold';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type {
  InternalAsyncValidator,
  InternalValidationOptions,
  InternalValidationResult,
  InternalValidator
} from '../internal/types/internal-validation';

/** Requires all of the schemas be satisfied. */
export interface AllOfSchema<TypeA, TypeB> extends Schema<TypeA & TypeB> {
  schemaType: 'allOf';
  schemas: [Schema<TypeA>, Schema<TypeB>];
}

/**
 * Requires all of the schemas be satisfied.
 *
 * The base form takes 2 schemas, but `allOf3`, `allOf4`, and `allOf5` take more.  If you need even more than that, use something like
 * `allOf(allOf5(…), allOf5(…))`
 */
export const allOf = <TypeA, TypeB>(schemaA: Schema<TypeA>, schemaB: Schema<TypeB>): Schema<TypeA & TypeB> => {
  const needsDeepSerDes = schemaA.usesCustomSerDes || schemaB.usesCustomSerDes;

  const internalValidate: InternalValidator = (value, validatorOptions, path) =>
    validateAllOf(value, { path, validatorOptions, schemas: [schemaA, schemaB], needsDeepSerDes });
  const internalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) =>
    asyncValidateAllOf(value, { path, validatorOptions, schemas: [schemaA, schemaB], needsDeepSerDes });

  return makeInternalSchema(
    {
      valueType: undefined as any as TypeA & TypeB,
      schemaType: 'allOf',
      schemas: [schemaA, schemaB],
      estimatedValidationTimeComplexity: schemaA.estimatedValidationTimeComplexity + schemaB.estimatedValidationTimeComplexity,
      usesCustomSerDes: needsDeepSerDes
    },
    { internalValidate, internalValidateAsync }
  );
};

export const allOf3 = <TypeA, TypeB, TypeC>(
  schemaA: Schema<TypeA>,
  schemaB: Schema<TypeB>,
  schemaC: Schema<TypeC>
): Schema<TypeA & TypeB & TypeC> => allOf(schemaA, allOf(schemaB, schemaC));

export const allOf4 = <TypeA, TypeB, TypeC, TypeD>(
  schemaA: Schema<TypeA>,
  schemaB: Schema<TypeB>,
  schemaC: Schema<TypeC>,
  schemaD: Schema<TypeD>
): Schema<TypeA & TypeB & TypeC & TypeD> => allOf(schemaA, allOf(schemaB, allOf(schemaC, schemaD)));

export const allOf5 = <TypeA, TypeB, TypeC, TypeD, TypeE>(
  schemaA: Schema<TypeA>,
  schemaB: Schema<TypeB>,
  schemaC: Schema<TypeC>,
  schemaD: Schema<TypeD>,
  schemaE: Schema<TypeE>
): Schema<TypeA & TypeB & TypeC & TypeD & TypeE> => allOf(schemaA, allOf(schemaB, allOf(schemaC, allOf(schemaD, schemaE))));

// Helpers

const validateAllOf = <TypeA, TypeB>(
  value: any,
  {
    schemas,
    needsDeepSerDes,
    path,
    validatorOptions
  }: {
    schemas: [Schema<TypeA>, Schema<TypeB>];
    needsDeepSerDes: boolean;
    path: string;
    validatorOptions: InternalValidationOptions;
  }
) => {
  const shouldStopOnFirstError = validatorOptions.validation === 'hard' || !needsDeepSerDes;

  if (!needsDeepSerDes && validatorOptions.validation === 'none') {
    return noError;
  }

  let errorResult: InternalValidationResult | undefined = undefined;
  for (const schema of schemas) {
    const result = (schema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
    if (errorResult === undefined && result.error !== undefined) {
      errorResult = result;

      if (shouldStopOnFirstError) {
        return errorResult!;
      }
    }
  }

  return errorResult ?? {};
};

const asyncValidateAllOf = async <TypeA, TypeB>(
  value: any,
  {
    schemas,
    needsDeepSerDes,
    path,
    validatorOptions
  }: {
    schemas: [Schema<TypeA>, Schema<TypeB>];
    needsDeepSerDes: boolean;
    path: string;
    validatorOptions: InternalValidationOptions;
  }
) => {
  const shouldStopOnFirstError = validatorOptions.validation === 'hard' || !needsDeepSerDes;

  if (!needsDeepSerDes && validatorOptions.validation === 'none') {
    return noError;
  }

  const asyncTimeComplexityThreshold = getAsyncTimeComplexityThreshold();

  let errorResult: InternalValidationResult | undefined = undefined;
  for (const schema of schemas) {
    const result =
      schema.estimatedValidationTimeComplexity > asyncTimeComplexityThreshold
        ? await (schema as any as InternalSchemaFunctions).internalValidateAsync(value, validatorOptions, path)
        : (schema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
    if (errorResult === undefined && result.error !== undefined) {
      errorResult = result;

      if (shouldStopOnFirstError) {
        return errorResult!;
      }
    }
  }

  return errorResult ?? noError;
};
