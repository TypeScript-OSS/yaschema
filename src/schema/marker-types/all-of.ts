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
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { getValidationMode } from '../internal/utils/get-validation-mode';
import { isMoreSevereResult } from '../internal/utils/is-more-severe-result';

/** Requires all of the schemas be satisfied. */
export interface AllOfSchema<TypeA, TypeB> extends Schema<TypeA & TypeB> {
  schemaType: 'allOf';
  clone: () => AllOfSchema<TypeA, TypeB>;

  schemas: [Schema<TypeA>, Schema<TypeB>];
}

/**
 * Requires all of the schemas be satisfied.
 *
 * The base form takes 2 schemas, but `allOf3`, `allOf4`, and `allOf5` take more.  If you need even more than that, use something like
 * `allOf(allOf5(…), allOf5(…))`
 */
export const allOf = <TypeA, TypeB>(schemaA: Schema<TypeA>, schemaB: Schema<TypeB>): AllOfSchema<TypeA, TypeB> => {
  const needsDeepSerDes = schemaA.usesCustomSerDes || schemaB.usesCustomSerDes;
  const isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval =
    schemaA.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval || schemaB.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval;

  const internalValidate: InternalValidator = (value, validatorOptions, path) =>
    validateAllOf(value, {
      path,
      validatorOptions,
      schemas: [schemaA, schemaB],
      needsDeepSerDes,
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval
    });
  const internalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) =>
    asyncValidateAllOf(value, {
      path,
      validatorOptions,
      schemas: [schemaA, schemaB],
      needsDeepSerDes,
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval
    });

  const fullSchema: AllOfSchema<TypeA, TypeB> = makeInternalSchema(
    {
      valueType: undefined as any as TypeA & TypeB,
      schemaType: 'allOf',
      clone: () => copyMetaFields({ from: fullSchema, to: allOf(fullSchema.schemas[0], fullSchema.schemas[1]) }),
      schemas: [schemaA, schemaB],
      estimatedValidationTimeComplexity: schemaA.estimatedValidationTimeComplexity + schemaB.estimatedValidationTimeComplexity,
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval,
      usesCustomSerDes: needsDeepSerDes
    },
    { internalValidate, internalValidateAsync }
  );

  return fullSchema;
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
    isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval,
    needsDeepSerDes,
    path,
    validatorOptions
  }: {
    schemas: [Schema<TypeA>, Schema<TypeB>];
    isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: boolean;
    needsDeepSerDes: boolean;
    path: string;
    validatorOptions: InternalValidationOptions;
  }
) => {
  const validationMode = getValidationMode(validatorOptions);
  const shouldStopOnFirstError = validationMode === 'hard' || (!needsDeepSerDes && !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval);

  if (!needsDeepSerDes && !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
    return noError;
  }

  let errorResult: InternalValidationResult | undefined = undefined;
  for (const schema of schemas) {
    const result = (schema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
    if (isMoreSevereResult(result, errorResult)) {
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
    isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval,
    needsDeepSerDes,
    path,
    validatorOptions
  }: {
    schemas: [Schema<TypeA>, Schema<TypeB>];
    isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: boolean;
    needsDeepSerDes: boolean;
    path: string;
    validatorOptions: InternalValidationOptions;
  }
) => {
  const validationMode = getValidationMode(validatorOptions);
  const shouldStopOnFirstError = validationMode === 'hard' || (!needsDeepSerDes && !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval);

  if (!needsDeepSerDes && !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
    return noError;
  }

  const asyncTimeComplexityThreshold = getAsyncTimeComplexityThreshold();

  let errorResult: InternalValidationResult | undefined = undefined;
  for (const schema of schemas) {
    const result =
      schema.estimatedValidationTimeComplexity > asyncTimeComplexityThreshold
        ? await (schema as any as InternalSchemaFunctions).internalValidateAsync(value, validatorOptions, path)
        : (schema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
    if (isMoreSevereResult(result, errorResult)) {
      errorResult = result;

      if (shouldStopOnFirstError) {
        return errorResult!;
      }
    }
  }

  return errorResult ?? noError;
};
