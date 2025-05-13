import { getAsyncTimeComplexityThreshold } from '../../../config/async-time-complexity-threshold.js';
import { forAsync } from '../../../internal/utils/forAsync.js';
import { once } from '../../../internal/utils/once.js';
import { withResolved } from '../../../internal/utils/withResolved.js';
import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof.js';
import type { Schema } from '../../../types/schema';
import type { TypeOrPromisedType } from '../../../types/TypeOrPromisedType.js';
import type { ValidationMode } from '../../../types/validation-options';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl/index.js';
import type { InternalState } from '../../internal/internal-schema-maker-impl/internal-state';
import type { GenericContainer } from '../../internal/types/generic-container';
import type { InternalSchemaFunctions } from '../../internal/types/internal-schema-functions';
import type {
  InternalAsyncValidator,
  InternalValidationErrorResult,
  InternalValidationResult
} from '../../internal/types/internal-validation';
import type { LazyPath } from '../../internal/types/lazy-path';
import { cloner } from '../../internal/utils/cloner.js';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields.js';
import { isErrorResult } from '../../internal/utils/is-error-result.js';
import { isMoreSevereResult } from '../../internal/utils/is-more-severe-result.js';
import { makeErrorResultForValidationMode } from '../../internal/utils/make-error-result-for-validation-mode.js';
import { makeClonedValueNoError, makeNoError } from '../../internal/utils/make-no-error.js';
import { appendPathIndex } from '../../internal/utils/path-utils.js';
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
}): ArraySchema<ItemT> => new ArraySchemaImpl(args);

// Helpers

/**
 * Requires an array, optionally with items matching the specified schema, and/or a min and/or max
 * length
 */
const asyncValidateArray = <ItemT>(
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
): TypeOrPromisedType<InternalValidationResult> => {
  const shouldStopOnFirstError =
    validationMode === 'hard' ||
    (!schema.usesCustomSerDes() &&
      !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval() &&
      internalState.transformation === 'none');

  if (!Array.isArray(value)) {
    return makeErrorResultForValidationMode(
      cloner(value),
      validationMode,
      () => `Expected array, found ${getMeaningfulTypeof(value)}`,
      path
    );
  }

  if (!schema.usesCustomSerDes() && !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval() && validationMode === 'none') {
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
  const chunkSize = Math.max(1, Math.floor(asyncTimeComplexityThreshold / items.estimatedValidationTimeComplexity()));
  const numValues = value.length;

  const processIndex = (index: number) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const arrayItem = value[index];

    if (
      !schema.usesCustomSerDes() &&
      !schema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval() &&
      schema.maxEntriesToValidate !== undefined &&
      index >= schema.maxEntriesToValidate
    ) {
      return false; // Reached the max number to validate
    }

    const result = (items as any as InternalSchemaFunctions).internalValidateAsync(
      arrayItem,
      internalState,
      appendPathIndex(path, index),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      container[index] ?? {},
      validationMode
    );
    return withResolved(result, (result) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      container[index] = isErrorResult(result) ? (container[index] ?? result.invalidValue()) : result.value;
      if (isMoreSevereResult(result, errorResult)) {
        errorResult = result as InternalValidationErrorResult;

        if (shouldStopOnFirstError) {
          return errorResult;
        }
      }

      return undefined;
    });
  };

  const processChunk = (chunkStartIndex: number) =>
    internalState.relaxIfNeeded(() =>
      forAsync(chunkStartIndex, (index) => index < Math.min(numValues, chunkStartIndex + chunkSize), 1, processIndex)
    );

  const processedChunks = forAsync(0, (chunkStartIndex) => chunkStartIndex < numValues, chunkSize, processChunk);
  return withResolved(processedChunks, (processedChunks) => {
    if (processedChunks !== false && processedChunks !== undefined) {
      return { ...processedChunks, invalidValue: () => container };
    }

    return errorResult !== undefined ? { ...errorResult, invalidValue: () => container } : makeNoError(container);
  });
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

  public override readonly estimatedValidationTimeComplexity;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval;

  public override readonly usesCustomSerDes;

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

    this.usesCustomSerDes = once(() => items?.usesCustomSerDes() ?? false);
    this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = once(
      () => items?.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval() ?? false
    );

    this.estimatedValidationTimeComplexity = once(
      () =>
        (items?.estimatedValidationTimeComplexity() ?? 1) *
        ((this.usesCustomSerDes() ? maxLength : maxEntriesToValidate) ?? ESTIMATED_AVG_ARRAY_LENGTH)
    );
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

  protected override overridableInternalValidateAsync: InternalAsyncValidator = (value, internalState, path, container, validationMode) =>
    asyncValidateArray(value, { schema: this, path, internalState, container, validationMode });

  protected override overridableGetExtraToStringFields = () => ({
    items: this.items,
    minLength: this.minLength,
    maxLength: this.maxLength,
    maxEntriesToValidate: this.maxEntriesToValidate
  });
}
