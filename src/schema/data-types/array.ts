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
import { isMoreSevereResult } from '../internal/utils/is-more-severe-result';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';
import { appendPathIndex } from '../internal/utils/path-utils';

const ESTIMATED_AVG_ARRAY_LENGTH = 100;

/** Requires an array. */
export interface ArraySchema<ItemT = any> extends Schema<ItemT[]> {
  schemaType: 'array';
  clone: () => ArraySchema<ItemT>;

  items?: Schema<ItemT>;
  minLength?: number;
  maxLength?: number;
  /**
   * If specified, only the first maxEntriesToValidate entries are validated -- applies to item validation but not pattern validation.
   * This is ignored if the items require custom serialization or deserialization
   */
  maxEntriesToValidate?: number;
}

/**
 * Requires an array.  Element validation is optional.
 *
 * Because validation of very long arrays can be prohibitively expensive in some cases, one may use the `maxEntriesToValidate` option to
 * limit the limit that are actually validated.  Note however, that `maxEntriesToValidate` is ignored if needed transformation is required
 * within the array elements, for example with an array of dates where the dates need to be serialized or deserialized.
 */
export const array = <ItemT = any>({
  items,
  minLength,
  maxEntriesToValidate,
  maxLength
}: {
  items?: Schema<ItemT>;
  minLength?: number;
  maxLength?: number;
  maxEntriesToValidate?: number;
} = {}): ArraySchema<ItemT> => {
  const needsDeepSerDes = items?.usesCustomSerDes ?? false;
  const isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = items?.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval ?? false;

  const internalValidate: InternalValidator = (value, validatorOptions, path) =>
    validateArray(value, {
      items,
      minLength,
      maxEntriesToValidate,
      maxLength,
      needsDeepSerDes,
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval,
      path,
      validatorOptions
    });
  const internalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) =>
    asyncValidateArray(value, {
      items,
      minLength,
      maxEntriesToValidate,
      maxLength,
      needsDeepSerDes,
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval,
      path,
      validatorOptions
    });

  const fullSchema: ArraySchema<ItemT> = makeInternalSchema(
    {
      valueType: undefined as any as ItemT[],
      schemaType: 'array',
      clone: () => copyMetaFields({ from: fullSchema, to: array(fullSchema) }),
      items,
      minLength,
      maxEntriesToValidate,
      maxLength,
      estimatedValidationTimeComplexity:
        (items?.estimatedValidationTimeComplexity ?? 1) *
        ((needsDeepSerDes ? maxLength : maxEntriesToValidate) ?? ESTIMATED_AVG_ARRAY_LENGTH),
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval,
      usesCustomSerDes: needsDeepSerDes
    },
    { internalValidate, internalValidateAsync }
  );

  return fullSchema;
};

// Helpers

/**
 * Requires an array, optionally with items matching the specified schema, and/or a min and/or max
 * length
 */
const validateArray = <ItemT>(
  value: any,
  {
    isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval,
    items,
    minLength = 0,
    maxLength,
    maxEntriesToValidate,
    needsDeepSerDes,
    path,
    validatorOptions
  }: {
    isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: boolean;
    items?: Schema<ItemT>;
    minLength?: number;
    maxLength?: number;
    /** If specified, only the first maxEntriesToValidate entries are validated -- applies to item validation but not pattern validation */
    maxEntriesToValidate?: number;
    needsDeepSerDes: boolean;
    path: string;
    validatorOptions: InternalValidationOptions;
  }
) => {
  const validationMode = getValidationMode(validatorOptions);
  const shouldStopOnFirstError = validationMode === 'hard' || (!needsDeepSerDes && !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval);

  if (!Array.isArray(value)) {
    return makeErrorResultForValidationMode(validationMode, () => `Expected array, found ${getMeaningfulTypeof(value)}`, path);
  }

  if (!needsDeepSerDes && !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
    return noError;
  }

  let errorResult: InternalValidationResult | undefined;

  if (errorResult === undefined && value.length < minLength) {
    errorResult = makeErrorResultForValidationMode(
      validationMode,
      () => `Expected an array with at least ${minLength} element(s), found an array with ${value.length} element(s)`,
      path
    );

    if (shouldStopOnFirstError) {
      return errorResult;
    }
  }

  if (errorResult === undefined && maxLength !== undefined && value.length > maxLength) {
    errorResult = makeErrorResultForValidationMode(
      validationMode,
      () => `Expected an array with at most ${maxLength} element(s), found an array with ${value.length} element(s)`,
      path
    );

    if (shouldStopOnFirstError) {
      return errorResult;
    }
  }

  if (items !== undefined) {
    let index = 0;
    for (const arrayItem of value) {
      if (
        !needsDeepSerDes &&
        !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval &&
        maxEntriesToValidate !== undefined &&
        index >= maxEntriesToValidate
      ) {
        break; // Reached the max number to validate
      }

      const result = (items as any as InternalSchemaFunctions).internalValidate(arrayItem, validatorOptions, appendPathIndex(path, index));
      if (isMoreSevereResult(result, errorResult)) {
        errorResult = result;

        if (shouldStopOnFirstError) {
          return errorResult;
        }
      }
      index += 1;
    }
  }

  return errorResult ?? noError;
};

/**
 * Requires an array, optionally with items matching the specified schema, and/or a min and/or max
 * length
 */
const asyncValidateArray = async <ItemT>(
  value: any,
  {
    isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval,
    items,
    minLength = 0,
    maxLength,
    maxEntriesToValidate,
    needsDeepSerDes,
    path,
    validatorOptions
  }: {
    isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: boolean;
    items?: Schema<ItemT>;
    minLength?: number;
    maxLength?: number;
    /** If specified, only the first maxEntriesToValidate entries are validated -- applies to item validation but not pattern validation */
    maxEntriesToValidate?: number;
    needsDeepSerDes: boolean;
    path: string;
    validatorOptions: InternalValidationOptions;
  }
) => {
  const validationMode = getValidationMode(validatorOptions);
  const shouldStopOnFirstError = validationMode === 'hard' || (!needsDeepSerDes && !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval);

  if (!Array.isArray(value)) {
    return makeErrorResultForValidationMode(validationMode, () => `Expected array, found ${getMeaningfulTypeof(value)}`, path);
  }

  if (!needsDeepSerDes && !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
    return noError;
  }

  let errorResult: InternalValidationResult | undefined;

  if (errorResult === undefined && value.length < minLength) {
    errorResult = makeErrorResultForValidationMode(
      validationMode,
      () => `Expected an array with at least ${minLength} element(s), found an array with ${value.length} element(s)`,
      path
    );

    if (shouldStopOnFirstError) {
      return errorResult;
    }
  }

  if (errorResult === undefined && maxLength !== undefined && value.length > maxLength) {
    errorResult = makeErrorResultForValidationMode(
      validationMode,
      () => `Expected an array with at most ${maxLength} element(s), found an array with ${value.length} element(s)`,
      path
    );

    if (shouldStopOnFirstError) {
      return errorResult;
    }
  }

  if (items === undefined) {
    return errorResult ?? noError;
  }

  const asyncTimeComplexityThreshold = getAsyncTimeComplexityThreshold();
  const chunkSize = Math.max(1, Math.floor(asyncTimeComplexityThreshold / items.estimatedValidationTimeComplexity));
  const numValues = value.length;

  const processChunk = async (chunkStartIndex: number) => {
    if (validatorOptions.shouldRelax()) {
      await validatorOptions.relax();
    }

    for (let index = chunkStartIndex; index < numValues && index < chunkStartIndex + chunkSize; index += 1) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const arrayItem = value[index];

      if (
        !needsDeepSerDes &&
        !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval &&
        maxEntriesToValidate !== undefined &&
        index >= maxEntriesToValidate
      ) {
        return false; // Reached the max number to validate
      }

      const result =
        items.estimatedValidationTimeComplexity > asyncTimeComplexityThreshold
          ? await (items as any as InternalSchemaFunctions).internalValidateAsync(arrayItem, validatorOptions, appendPathIndex(path, index))
          : (items as any as InternalSchemaFunctions).internalValidate(arrayItem, validatorOptions, appendPathIndex(path, index));
      if (isMoreSevereResult(result, errorResult)) {
        errorResult = result;

        if (shouldStopOnFirstError) {
          return errorResult;
        }
      }
    }

    return undefined;
  };

  for (let chunkStartIndex = 0; chunkStartIndex < numValues; chunkStartIndex += chunkSize) {
    const chunkRes = await processChunk(chunkStartIndex);
    if (chunkRes === false) {
      break; // Reached the max number to validate
    } else if (chunkRes !== undefined) {
      chunkRes;
    }
  }

  return errorResult ?? noError;
};
