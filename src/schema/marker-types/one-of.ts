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
import { atPath } from '../internal/utils/path-utils';

/** Requires at least one of the schemas be satisfied. */
export interface OneOfSchema<TypeA, TypeB> extends Schema<TypeA | TypeB> {
  schemaType: 'oneOf';
  schemas: [Schema<TypeA>, Schema<TypeB>];
}

/**
 * Requires at least one of the schemas be satisfied.
 *
 * The base form takes 2 schemas, but `oneOf3`, `oneOf4`, and `oneOf5` take more.  If you need even more than that, use something like
 * `oneOf(oneOf5(…), oneOf5(…))`
 */
export const oneOf = <TypeA, TypeB>(schemaA: Schema<TypeA>, schemaB: Schema<TypeB>): Schema<TypeA | TypeB> => {
  const needsDeepSerDes = schemaA.usesCustomSerDes || schemaB.usesCustomSerDes;

  const internalValidate: InternalValidator = (value, validatorOptions, path) =>
    validateOneOf(value, { schemas: [schemaA, schemaB], needsDeepSerDes, path, validatorOptions });
  const internalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) =>
    validateOneOfAsync(value, { schemas: [schemaA, schemaB], needsDeepSerDes, path, validatorOptions });

  return makeInternalSchema(
    {
      valueType: undefined as any as TypeA | TypeB,
      schemaType: 'oneOf',
      schemas: [schemaA, schemaB],
      estimatedValidationTimeComplexity: schemaA.estimatedValidationTimeComplexity + schemaB.estimatedValidationTimeComplexity,
      usesCustomSerDes: needsDeepSerDes
    },
    { internalValidate, internalValidateAsync }
  );
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
  if (!needsDeepSerDes && validatorOptions.validation === 'none') {
    return noError;
  }

  const validationResults: InternalValidationResult[] = [];

  let success = false;
  for (const schema of schemas) {
    const result = (schema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
    if (result.error === undefined) {
      success = true;

      if (!needsDeepSerDes) {
        return noError;
      }
    } else {
      validationResults.push(result);
    }
  }

  return success
    ? noError
    : {
        error: () =>
          `Expected one of: ${validationResults.map((r) => r.error!()).join(' or ')}, found ${getMeaningfulTypeof(value)}${atPath(path)}`
      };
};

/** Requires one of the specified schemas to be satisfied */
const validateOneOfAsync = async <TypeA, TypeB>(
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
  if (!needsDeepSerDes && validatorOptions.validation === 'none') {
    return noError;
  }

  const validationResults: InternalValidationResult[] = [];

  const asyncTimeComplexityThreshold = getAsyncTimeComplexityThreshold();

  for (const schema of schemas) {
    const result =
      schema.estimatedValidationTimeComplexity > asyncTimeComplexityThreshold
        ? await (schema as any as InternalSchemaFunctions).internalValidateAsync(value, validatorOptions, path)
        : (schema as any as InternalSchemaFunctions).internalValidate(value, validatorOptions, path);
    if (result.error === undefined) {
      return noError;
    } else {
      validationResults.push(result);
    }
  }

  return {
    error: () =>
      `Expected one of: ${validationResults.map((r) => r.error!()).join(' or ')}, found ${getMeaningfulTypeof(value)}${atPath(path)}`
  };
};
