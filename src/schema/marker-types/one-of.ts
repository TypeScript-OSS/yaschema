import { getAsyncTimeComplexityThreshold } from '../../config/async-time-complexity-threshold';
import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
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
import { isErrorResult } from '../internal/utils/is-error-result';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';

/** Requires at least one of the schemas be satisfied. */
export interface OneOfSchema<TypeA, TypeB> extends Schema<TypeA | TypeB> {
  schemaType: 'oneOf';
  clone: () => OneOfSchema<TypeA, TypeB>;

  schemas: [Schema<TypeA>, Schema<TypeB>];
}

/**
 * Requires at least one of the schemas be satisfied.
 *
 * The base form takes 2 schemas, but `oneOf3`, `oneOf4`, and `oneOf5` take more.  If you need even more than that, use something like
 * `oneOf(oneOf5(…), oneOf5(…))`
 */
export const oneOf = <TypeA, TypeB>(schemaA: Schema<TypeA>, schemaB: Schema<TypeB>): OneOfSchema<TypeA, TypeB> => {
  const needsDeepSerDes = schemaA.usesCustomSerDes || schemaB.usesCustomSerDes;
  const isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval =
    schemaA.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval || schemaB.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval;

  const internalValidate: InternalValidator = (value, validatorOptions, path) =>
    validateOneOf(value, {
      schemas: [schemaA, schemaB],
      needsDeepSerDes,
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval,
      path,
      validatorOptions
    });
  const internalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) =>
    validateOneOfAsync(value, {
      schemas: [schemaA, schemaB],
      needsDeepSerDes,
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval,
      path,
      validatorOptions
    });

  const fullSchema: OneOfSchema<TypeA, TypeB> = makeInternalSchema(
    {
      valueType: undefined as any as TypeA | TypeB,
      schemaType: 'oneOf',
      clone: () => copyMetaFields({ from: fullSchema, to: oneOf(fullSchema.schemas[0], fullSchema.schemas[1]) }),
      schemas: [schemaA, schemaB],
      estimatedValidationTimeComplexity: schemaA.estimatedValidationTimeComplexity + schemaB.estimatedValidationTimeComplexity,
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval,
      usesCustomSerDes: needsDeepSerDes
    },
    { internalValidate, internalValidateAsync }
  );

  return fullSchema;
};

export const oneOf3 = <TypeA, TypeB, TypeC>(
  schemaA: Schema<TypeA>,
  schemaB: Schema<TypeB>,
  schemaC: Schema<TypeC>
): Schema<TypeA | TypeB | TypeC> => oneOf(schemaA, oneOf(schemaB, schemaC));

export const oneOf4 = <TypeA, TypeB, TypeC, TypeD>(
  schemaA: Schema<TypeA>,
  schemaB: Schema<TypeB>,
  schemaC: Schema<TypeC>,
  schemaD: Schema<TypeD>
): Schema<TypeA | TypeB | TypeC | TypeD> => oneOf(schemaA, oneOf(schemaB, oneOf(schemaC, schemaD)));

export const oneOf5 = <TypeA, TypeB, TypeC, TypeD, TypeE>(
  schemaA: Schema<TypeA>,
  schemaB: Schema<TypeB>,
  schemaC: Schema<TypeC>,
  schemaD: Schema<TypeD>,
  schemaE: Schema<TypeE>
): Schema<TypeA | TypeB | TypeC | TypeD | TypeE> => oneOf(schemaA, oneOf(schemaB, oneOf(schemaC, oneOf(schemaD, schemaE))));

// Helpers

/** Requires one of the specified schemas to be satisfied */
const validateOneOf = <TypeA, TypeB>(
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
): InternalValidationResult => {
  const validationMode = getValidationMode(validatorOptions);
  if (!needsDeepSerDes && !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
    return noError;
  }

  const validationResults: InternalValidationResult[] = [];

  let success = false;
  for (const schema of schemas) {
    const result = (schema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
    if (!isErrorResult(result)) {
      success = true;

      if (!needsDeepSerDes && !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval) {
        return noError;
      }
    } else {
      validationResults.push(result);
    }
  }

  return success
    ? noError
    : makeErrorResultForValidationMode(
        validationMode,
        () => `Expected one of: ${validationResults.map((r) => r.error?.() ?? '').join(' or ')}, found ${getMeaningfulTypeof(value)}`,
        path
      );
};

/** Requires one of the specified schemas to be satisfied */
const validateOneOfAsync = async <TypeA, TypeB>(
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
  if (!needsDeepSerDes && !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
    return noError;
  }

  const asyncTimeComplexityThreshold = getAsyncTimeComplexityThreshold();

  const validationResults: InternalValidationResult[] = [];

  let success = false;
  for (const schema of schemas) {
    const result =
      schema.estimatedValidationTimeComplexity > asyncTimeComplexityThreshold
        ? await (schema as any as InternalSchemaFunctions).internalValidateAsync(value, validatorOptions, path)
        : (schema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
    if (!isErrorResult(result)) {
      success = true;

      if (!needsDeepSerDes && !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval) {
        return noError;
      }
    } else {
      validationResults.push(result);
    }
  }

  return success
    ? noError
    : makeErrorResultForValidationMode(
        validationMode,
        () => `Expected one of: ${validationResults.map((r) => r.error?.() ?? '').join(' or ')}, found ${getMeaningfulTypeof(value)}`,
        path
      );
};
