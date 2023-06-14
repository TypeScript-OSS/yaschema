import { getAsyncTimeComplexityThreshold } from '../../../config/async-time-complexity-threshold';
import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../../types/schema';
import type { ValidationMode } from '../../../types/validation-options';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl';
import type { InternalState } from '../../internal/internal-schema-maker-impl/internal-state';
import type { GenericContainer } from '../../internal/types/generic-container';
import type { InternalSchemaFunctions } from '../../internal/types/internal-schema-functions';
import type {
  InternalAsyncValidator,
  InternalValidationErrorResult,
  InternalValidationResult,
  InternalValidator
} from '../../internal/types/internal-validation';
import type { LazyPath } from '../../internal/types/lazy-path';
import { cloner } from '../../internal/utils/cloner';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields';
import { isErrorResult } from '../../internal/utils/is-error-result';
import { isMoreSevereResult } from '../../internal/utils/is-more-severe-result';
import { makeErrorResultForValidationMode } from '../../internal/utils/make-error-result-for-validation-mode';
import { makeClonedValueNoError, makeNoError } from '../../internal/utils/make-no-error';
import { appendPathIndex } from '../../internal/utils/path-utils';
import type { ArraySchema } from '../types/ArraySchema';

const ESTIMATED_AVG_ARRAY_LENGTH = 100;

/**
 * Requires an array.  Element validation is optional.
 *
 * Because validation of very long arrays can be prohibitively expensive in some cases, one may use the `maxEntriesToValidate` option to
 * limit the limit that are actually validated.  Note however, that `maxEntriesToValidate` is ignored if needed transformation is required
 * within the array elements, for example with an array of dates where the dates need to be serialized or deserialized.
 */
export const array = <ItemT = any>(args?: {
  items?: Schema<ItemT>;
  minLength?: number;
  maxLength?: number;
  maxEntriesToValidate?: number;
}) => new ArraySchemaImpl(args);

// Helpers

/**
 * Requires an array, optionally with items matching the specified schema, and/or a min and/or max
 * length
 */
const validateArray = <ItemT>(
  value: any,
  {
    schema,
    path,
    internalState,
    container,
    validationMode
  }: {
    schema: ArraySchema<ItemT>;
    path: LazyPath;
    internalState: InternalState;
    container: GenericContainer;
    validationMode: ValidationMode;
  }
): InternalValidationResult => {
  const shouldStopOnFirstError =
    validationMode === 'hard' ||
    (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && internalState.transformation === 'none');

  if (!Array.isArray(value)) {
    return makeErrorResultForValidationMode(
      cloner(value),
      validationMode,
      () => `Expected array, found ${getMeaningfulTypeof(value)}`,
      path
    );
  }

  if (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
    return makeClonedValueNoError(value);
  }

  let errorResult: InternalValidationErrorResult | undefined;

  if (errorResult === undefined && value.length < schema.minLength) {
    errorResult = makeErrorResultForValidationMode(
      cloner(value),
      validationMode,
      () => `Expected an array with at least ${schema.minLength} element(s), found an array with ${value.length} element(s)`,
      path
    );

    if (shouldStopOnFirstError) {
      return errorResult;
    }
  }

  if (errorResult === undefined && schema.maxLength !== undefined && value.length > schema.maxLength) {
    errorResult = makeErrorResultForValidationMode(
      cloner(value),
      validationMode,
      () => `Expected an array with at most ${schema.maxLength} element(s), found an array with ${value.length} element(s)`,
      path
    );

    if (shouldStopOnFirstError) {
      return errorResult;
    }
  }

  if (!Array.isArray(container)) {
    container = [];
  }

  const items = schema.items;
  if (items !== undefined) {
    let index = 0;
    for (const arrayItem of value) {
      if (
        !schema.usesCustomSerDes &&
        !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval &&
        schema.maxEntriesToValidate !== undefined &&
        index >= schema.maxEntriesToValidate
      ) {
        break; // Reached the max number to validate
      }

      const result = (items as any as InternalSchemaFunctions).internalValidate(
        arrayItem,
        internalState,
        appendPathIndex(path, index),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        container[index] ?? {},
        validationMode
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      container[index] = isErrorResult(result) ? container[index] ?? result.invalidValue() : result.value;
      if (isMoreSevereResult(result, errorResult)) {
        errorResult = result as InternalValidationErrorResult;

        if (shouldStopOnFirstError) {
          return { ...errorResult, invalidValue: () => container };
        }
      }
      index += 1;
    }
  } else {
    let index = 0;
    for (const arrayItem of value) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      container[index] = container[index] ?? arrayItem;

      index += 1;
    }
  }

  return errorResult !== undefined ? { ...errorResult, invalidValue: () => container } : makeNoError(container);
};

/**
 * Requires an array, optionally with items matching the specified schema, and/or a min and/or max
 * length
 */
const asyncValidateArray = async <ItemT>(
  value: any,
  {
    schema,
    path,
    internalState,
    container,
    validationMode
  }: {
    schema: ArraySchema<ItemT>;
    path: LazyPath;
    internalState: InternalState;
    container: GenericContainer;
    validationMode: ValidationMode;
  }
): Promise<InternalValidationResult> => {
  const shouldStopOnFirstError =
    validationMode === 'hard' ||
    (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && internalState.transformation === 'none');

  if (!Array.isArray(value)) {
    return makeErrorResultForValidationMode(
      cloner(value),
      validationMode,
      () => `Expected array, found ${getMeaningfulTypeof(value)}`,
      path
    );
  }

  if (!schema.usesCustomSerDes && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
    return makeClonedValueNoError(value);
  }

  let errorResult: InternalValidationErrorResult | undefined;

  if (errorResult === undefined && value.length < schema.minLength) {
    errorResult = makeErrorResultForValidationMode(
      cloner(value),
      validationMode,
      () => `Expected an array with at least ${schema.minLength} element(s), found an array with ${value.length} element(s)`,
      path
    );

    if (shouldStopOnFirstError) {
      return errorResult;
    }
  }

  if (errorResult === undefined && schema.maxLength !== undefined && value.length > schema.maxLength) {
    errorResult = makeErrorResultForValidationMode(
      cloner(value),
      validationMode,
      () => `Expected an array with at most ${schema.maxLength} element(s), found an array with ${value.length} element(s)`,
      path
    );

    if (shouldStopOnFirstError) {
      return errorResult;
    }
  }

  if (!Array.isArray(container)) {
    container = [];
  }

  const items = schema.items;
  if (items === undefined) {
    let index = 0;
    for (const arrayItem of value) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      container[index] = container[index] ?? arrayItem;

      index += 1;
    }

    return errorResult !== undefined ? { ...errorResult, invalidValue: () => container } : makeNoError(container);
  }

  const asyncTimeComplexityThreshold = getAsyncTimeComplexityThreshold();
  const chunkSize = Math.max(1, Math.floor(asyncTimeComplexityThreshold / items.estimatedValidationTimeComplexity));
  const numValues = value.length;

  const processChunk = async (chunkStartIndex: number) => {
    if (internalState.shouldRelax()) {
      await internalState.relax();
    }

    for (let index = chunkStartIndex; index < numValues && index < chunkStartIndex + chunkSize; index += 1) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const arrayItem = value[index];

      if (
        !schema.usesCustomSerDes &&
        !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval &&
        schema.maxEntriesToValidate !== undefined &&
        index >= schema.maxEntriesToValidate
      ) {
        return false; // Reached the max number to validate
      }

      const result =
        items.estimatedValidationTimeComplexity > asyncTimeComplexityThreshold
          ? await (items as any as InternalSchemaFunctions).internalValidateAsync(
              arrayItem,
              internalState,
              appendPathIndex(path, index),
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              container[index] ?? {},
              validationMode
            )
          : (items as any as InternalSchemaFunctions).internalValidate(
              arrayItem,
              internalState,
              appendPathIndex(path, index),
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              container[index] ?? {},
              validationMode
            );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      container[index] = isErrorResult(result) ? container[index] ?? result.invalidValue() : result.value;
      if (isMoreSevereResult(result, errorResult)) {
        errorResult = result as InternalValidationErrorResult;

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
      return { ...chunkRes, invalidValue: () => container };
    }
  }

  return errorResult !== undefined ? { ...errorResult, invalidValue: () => container } : makeNoError(container);
};

class ArraySchemaImpl<ItemT = any> extends InternalSchemaMakerImpl<ItemT[]> implements ArraySchema<ItemT> {
  // Public Fields

  public readonly items?: Schema<ItemT>;

  public readonly minLength: number;

  public readonly maxLength: number;

  public readonly maxEntriesToValidate?: number;

  // PureSchema Field Overrides

  public override readonly schemaType = 'array';

  public override readonly valueType = undefined as any as ItemT[];

  public override readonly estimatedValidationTimeComplexity: number;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: boolean;

  public override readonly usesCustomSerDes: boolean;

  public override readonly isContainerType = true;

  // Initialization

  constructor({
    items,
    minLength,
    maxEntriesToValidate,
    maxLength
  }: {
    items?: Schema<ItemT>;
    minLength?: number;
    maxLength?: number;
    maxEntriesToValidate?: number;
  } = {}) {
    super();

    this.items = items;
    this.minLength = minLength ?? 0;
    this.maxLength = maxLength ?? Number.MAX_SAFE_INTEGER;
    this.maxEntriesToValidate = maxEntriesToValidate;

    this.usesCustomSerDes = items?.usesCustomSerDes ?? false;
    this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = items?.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval ?? false;

    this.estimatedValidationTimeComplexity =
      (items?.estimatedValidationTimeComplexity ?? 1) *
      ((this.usesCustomSerDes ? maxLength : maxEntriesToValidate) ?? ESTIMATED_AVG_ARRAY_LENGTH);
  }

  // Public Methods

  public readonly clone = (): ArraySchema<ItemT> =>
    copyMetaFields({
      from: this,
      to: new ArraySchemaImpl({
        items: this.items,
        minLength: this.minLength,
        maxLength: this.maxLength,
        maxEntriesToValidate: this.maxEntriesToValidate
      })
    });

  // Method Overrides

  protected override overridableInternalValidate: InternalValidator = (value, internalState, path, container, validationMode) =>
    validateArray(value, { schema: this, path, internalState, container, validationMode });

  protected override overridableInternalValidateAsync: InternalAsyncValidator = async (
    value,
    internalState,
    path,
    container,
    validationMode
  ) => asyncValidateArray(value, { schema: this, path, internalState, container, validationMode });

  protected override overridableGetExtraToStringFields = () => ({
    items: this.items,
    minLength: this.minLength,
    maxLength: this.maxLength,
    maxEntriesToValidate: this.maxEntriesToValidate
  });
}
