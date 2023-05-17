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
import type { LazyPath } from '../internal/types/lazy-path';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { getValidationMode } from '../internal/utils/get-validation-mode';
import { isMoreSevereResult } from '../internal/utils/is-more-severe-result';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';
import { appendPathIndex } from '../internal/utils/path-utils';

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
  clone: () => TupleSchema<TypeA, TypeB, TypeC, TypeD, TypeE>;

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
  const isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval =
    (items[0]?.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval ||
      items[1]?.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval ||
      items[2]?.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval ||
      items[3]?.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval ||
      items[4]?.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval) ??
    false;

  const internalValidate: InternalValidator = (value, validatorOptions, path) =>
    validateTuple(value, { items, needsDeepSerDes, isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval, path, validatorOptions });
  const internalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) =>
    validateTupleAsync(value, { items, needsDeepSerDes, isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval, path, validatorOptions });

  const fullSchema: TupleSchema<TypeA, TypeB, TypeC, TypeD, TypeE> = makeInternalSchema(
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
      clone: () => copyMetaFields({ from: fullSchema, to: tuple(fullSchema) }),
      items,
      estimatedValidationTimeComplexity,
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval,
      usesCustomSerDes: needsDeepSerDes
    },
    { internalValidate, internalValidateAsync }
  );

  return fullSchema;
};

// Helpers

/** Requires an array, with items matching the specified schema */
const validateTuple = <TypeA = void, TypeB = void, TypeC = void, TypeD = void, TypeE = void>(
  value: any,
  {
    isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval,
    items,
    needsDeepSerDes,
    path,
    validatorOptions
  }: {
    isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: boolean;
    items:
      | []
      | [Schema<TypeA>]
      | [Schema<TypeA>, Schema<TypeB>]
      | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>]
      | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>]
      | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>, Schema<TypeE>];
    needsDeepSerDes: boolean;
    path: LazyPath;
    validatorOptions: InternalValidationOptions;
  }
): InternalValidationResult => {
  const validationMode = getValidationMode(validatorOptions);
  const shouldStopOnFirstError = validationMode === 'hard' || (!needsDeepSerDes && !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval);

  if (!Array.isArray(value)) {
    return makeErrorResultForValidationMode(validationMode, () => `Expected array, found ${getMeaningfulTypeof(value)}`, path);
  }

  if (!needsDeepSerDes && !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
    return noError;
  }

  let errorResult: InternalValidationResult | undefined;

  if (errorResult === undefined && value.length !== items.length) {
    errorResult = makeErrorResultForValidationMode(
      validationMode,
      () => `Expected an array with ${items.length} element(s), found an array with ${value.length} element(s)`,
      path
    );

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
    if (isMoreSevereResult(result, errorResult)) {
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
    isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval,
    items,
    needsDeepSerDes,
    path,
    validatorOptions
  }: {
    isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: boolean;
    items:
      | []
      | [Schema<TypeA>]
      | [Schema<TypeA>, Schema<TypeB>]
      | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>]
      | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>]
      | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>, Schema<TypeE>];
    needsDeepSerDes: boolean;
    path: LazyPath;
    validatorOptions: InternalValidationOptions;
  }
): Promise<InternalValidationResult> => {
  const validationMode = getValidationMode(validatorOptions);
  const shouldStopOnFirstError = validationMode === 'hard' || (!needsDeepSerDes && !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval);

  if (!Array.isArray(value)) {
    return makeErrorResultForValidationMode(validationMode, () => `Expected array, found ${getMeaningfulTypeof(value)}`, path);
  }

  if (!needsDeepSerDes && !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
    return noError;
  }

  let errorResult: InternalValidationResult | undefined;

  if (errorResult === undefined && value.length !== items.length) {
    errorResult = makeErrorResultForValidationMode(
      validationMode,
      () => `Expected an array with ${items.length} element(s), found an array with ${value.length} element(s)`,
      path
    );

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
    if (isMoreSevereResult(result, errorResult)) {
      errorResult = result;

      if (shouldStopOnFirstError) {
        return errorResult;
      }
    }
  }

  return errorResult ?? noError;
};
