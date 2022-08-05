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
import { appendPathIndex, atPath } from '../internal/utils/path-utils';

/** Requires a value where items must positionally match the specified schemas */
export interface TupleSchema<TypeA = void, TypeB = void, TypeC = void, TypeD = void, TypeE = void>
  extends Schema<
    TypeA extends void
      ? []
      : TypeB extends void
      ? [TypeA]
      : TypeC extends void
      ? [TypeA, TypeB]
      : TypeD extends void
      ? [TypeA, TypeB, TypeC]
      : TypeE extends void
      ? [TypeA, TypeB, TypeC, TypeD]
      : [TypeA, TypeB, TypeC, TypeD, TypeE]
  > {
  schemaType: 'tuple';
  items:
    | []
    | [Schema<TypeA>]
    | [Schema<TypeA>, Schema<TypeB>]
    | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>]
    | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>]
    | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>, Schema<TypeE>];
}

/** Requires a value where items must positionally match the specified schemas */
export const tuple = <TypeA = void, TypeB = void, TypeC = void, TypeD = void, TypeE = void>({
  items
}: {
  items:
    | []
    | [Schema<TypeA>]
    | [Schema<TypeA>, Schema<TypeB>]
    | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>]
    | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>]
    | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>, Schema<TypeE>];
}): TupleSchema<TypeA, TypeB, TypeC, TypeD, TypeE> => {
  const estimatedValidationTimeComplexity =
    (items[0]?.estimatedValidationTimeComplexity ?? 0) +
    (items[1]?.estimatedValidationTimeComplexity ?? 0) +
    (items[2]?.estimatedValidationTimeComplexity ?? 0) +
    (items[3]?.estimatedValidationTimeComplexity ?? 0) +
    (items[4]?.estimatedValidationTimeComplexity ?? 0);
  const needsDeepSerDes =
    (items[0]?.usesCustomSerDes ||
      items[1]?.usesCustomSerDes ||
      items[2]?.usesCustomSerDes ||
      items[3]?.usesCustomSerDes ||
      items[4]?.usesCustomSerDes) ??
    false;

  const internalValidate: InternalValidator = (value, validatorOptions, path) =>
    validateTuple(value, { items, needsDeepSerDes, path, validatorOptions });
  const internalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) =>
    validateTupleAsync(value, { items, needsDeepSerDes, path, validatorOptions });

  return makeInternalSchema(
    {
      valueType: undefined as any as TypeA extends void
        ? []
        : TypeB extends void
        ? [TypeA]
        : TypeC extends void
        ? [TypeA, TypeB]
        : TypeD extends void
        ? [TypeA, TypeB, TypeC]
        : TypeE extends void
        ? [TypeA, TypeB, TypeC, TypeD]
        : [TypeA, TypeB, TypeC, TypeD, TypeE],
      schemaType: 'tuple',
      items,
      estimatedValidationTimeComplexity,
      usesCustomSerDes: needsDeepSerDes
    },
    { internalValidate, internalValidateAsync }
  );
};

// Helpers

/** Requires an array, with items matching the specified schema */
const validateTuple = <TypeA = void, TypeB = void, TypeC = void, TypeD = void, TypeE = void>(
  value: any,
  {
    items,
    needsDeepSerDes,
    path,
    validatorOptions
  }: {
    items:
      | []
      | [Schema<TypeA>]
      | [Schema<TypeA>, Schema<TypeB>]
      | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>]
      | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>]
      | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>, Schema<TypeE>];
    needsDeepSerDes: boolean;
    path: string;
    validatorOptions: InternalValidationOptions;
  }
) => {
  const shouldStopOnFirstError = validatorOptions.validation === 'hard' || !needsDeepSerDes;

  if (!Array.isArray(value)) {
    return { error: () => `Expected array, found ${getMeaningfulTypeof(value)}${atPath(path)}` };
  }

  if (!needsDeepSerDes && validatorOptions.validation === 'none') {
    return noError;
  }

  let errorResult: InternalValidationResult | undefined;

  if (errorResult === undefined && value.length !== items.length) {
    errorResult = {
      error: () => `Expected an array with ${items.length} element(s), found an array with ${value.length} element(s)${atPath(path)}`
    };

    if (shouldStopOnFirstError) {
      return errorResult;
    }
  }

  for (let index = 0; index < items.length; index += 1) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const arrayItem = value[index];

    const result = (items[index] as any as InternalSchemaFunctions).internalValidate(
      arrayItem,
      validatorOptions,
      appendPathIndex(path, index)
    );
    if (errorResult === undefined && result.error !== undefined) {
      errorResult = result;

      if (shouldStopOnFirstError) {
        return errorResult;
      }
    }
  }

  return errorResult ?? noError;
};

/** Requires an array, with items matching the specified schema */
const validateTupleAsync = async <TypeA = void, TypeB = void, TypeC = void, TypeD = void, TypeE = void>(
  value: any,
  {
    items,
    needsDeepSerDes,
    path,
    validatorOptions
  }: {
    items:
      | []
      | [Schema<TypeA>]
      | [Schema<TypeA>, Schema<TypeB>]
      | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>]
      | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>]
      | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>, Schema<TypeE>];
    needsDeepSerDes: boolean;
    path: string;
    validatorOptions: InternalValidationOptions;
  }
) => {
  const shouldStopOnFirstError = validatorOptions.validation === 'hard' || !needsDeepSerDes;

  if (!Array.isArray(value)) {
    return { error: () => `Expected array, found ${getMeaningfulTypeof(value)}${atPath(path)}` };
  }

  if (!needsDeepSerDes && validatorOptions.validation === 'none') {
    return noError;
  }

  let errorResult: InternalValidationResult | undefined;

  if (errorResult === undefined && value.length !== items.length) {
    errorResult = {
      error: () => `Expected an array with ${items.length} element(s), found an array with ${value.length} element(s)${atPath(path)}`
    };

    if (shouldStopOnFirstError) {
      return errorResult;
    }
  }

  const asyncTimeComplexityThreshold = getAsyncTimeComplexityThreshold();
  for (let index = 0; index < items.length; index += 1) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const arrayItem = value[index];

    const result =
      items[index].estimatedValidationTimeComplexity > asyncTimeComplexityThreshold
        ? await (items[index] as any as InternalSchemaFunctions).internalValidateAsync(
            arrayItem,
            validatorOptions,
            appendPathIndex(path, index)
          )
        : (items[index] as any as InternalSchemaFunctions).internalValidate(arrayItem, validatorOptions, appendPathIndex(path, index));
    if (errorResult === undefined && result.error !== undefined) {
      errorResult = result;

      if (shouldStopOnFirstError) {
        return errorResult;
      }
    }
  }

  return errorResult ?? noError;
};
