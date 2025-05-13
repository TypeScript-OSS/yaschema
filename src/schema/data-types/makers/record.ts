import { getAsyncTimeComplexityThreshold } from '../../../config/async-time-complexity-threshold.js';
import { forAsync } from '../../../internal/utils/forAsync.js';
import { once } from '../../../internal/utils/once.js';
import { safeClone } from '../../../internal/utils/safeClone.js';
import { withResolved } from '../../../internal/utils/withResolved.js';
import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof.js';
import type { Schema } from '../../../types/schema';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl/index.js';
import type { InternalSchemaFunctions } from '../../internal/types/internal-schema-functions';
import type { InternalAsyncValidator, InternalValidationErrorResult } from '../../internal/types/internal-validation';
import { cloner } from '../../internal/utils/cloner.js';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields.js';
import { isErrorResult } from '../../internal/utils/is-error-result.js';
import { isMoreSevereResult } from '../../internal/utils/is-more-severe-result.js';
import { makeErrorResultForValidationMode } from '../../internal/utils/make-error-result-for-validation-mode.js';
import { makeClonedValueNoError, makeNoError } from '../../internal/utils/make-no-error.js';
import { appendPathComponent } from '../../internal/utils/path-utils.js';
import type { RecordSchema } from '../types/RecordSchema';

const ESTIMATED_AVG_RECORD_SIZE = 25;

/** Requires a non-null, non-array object.  Schemas are specified for keys as a whole and for values as a whole.  Empty objects are allowed
 * by default and values for keys not matching the specified key schema are always allowed, since they either just extra data or they're
 * tested by another schema, ex. using an `allOf` schema. */
export const record = <KeyT extends string, ValueT>(keys: RegExp | Schema<KeyT>, valueSchema: Schema<ValueT>): RecordSchema<KeyT, ValueT> =>
  new RecordSchemaImpl<KeyT, ValueT>(keys, valueSchema);

// Helpers

class RecordSchemaImpl<KeyT extends string, ValueT>
  extends InternalSchemaMakerImpl<Partial<Record<KeyT, ValueT>>>
  implements RecordSchema<KeyT, ValueT>
{
  // Public Fields

  public allowUnknownKeys = false;

  public readonly keys: RegExp | Schema<KeyT>;

  public readonly valueSchema: Schema<ValueT>;

  // PureSchema Field Overrides

  public override readonly schemaType = 'record';

  public override readonly valueType = undefined as any as Partial<Record<KeyT, ValueT>>;

  public override readonly estimatedValidationTimeComplexity;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval;

  public override readonly usesCustomSerDes;

  // Private Fields

  private readonly estimatedValidationTimeComplexityPerItem_: () => number;

  // Initialization

  constructor(keys: RegExp | Schema<KeyT>, valueSchema: Schema<ValueT>) {
    super();

    this.keys = keys;
    this.valueSchema = valueSchema;

    const areKeysRegExps = keys instanceof RegExp;

    this.estimatedValidationTimeComplexityPerItem_ = once(
      () => (areKeysRegExps ? 1 : keys.estimatedValidationTimeComplexity()) + valueSchema.estimatedValidationTimeComplexity()
    );
    this.estimatedValidationTimeComplexity = once(() => this.estimatedValidationTimeComplexityPerItem_() * ESTIMATED_AVG_RECORD_SIZE);

    this.usesCustomSerDes = once(() => (!areKeysRegExps && keys.usesCustomSerDes()) || valueSchema.usesCustomSerDes());
    this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = once(
      () =>
        (!areKeysRegExps && keys.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval()) ||
        valueSchema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval()
    );
  }

  // Public Methods

  public readonly clone = (): RecordSchema<KeyT, ValueT> => copyMetaFields({ from: this, to: record(this.keys, this.valueSchema) });

  public readonly setAllowUnknownKeys = (allow: boolean) => {
    this.allowUnknownKeys = allow;

    return this;
  };

  // Method Overrides

  protected override overridableInternalValidateAsync: InternalAsyncValidator = (value, internalState, path, container, validationMode) => {
    const shouldStopOnFirstError =
      validationMode === 'hard' ||
      (!this.usesCustomSerDes() &&
        !this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval() &&
        internalState.transformation === 'none');

    if (value === null || Array.isArray(value) || typeof value !== 'object') {
      return makeErrorResultForValidationMode(
        cloner(value),
        validationMode,
        () => `Expected object, found ${getMeaningfulTypeof(value)}`,
        path
      );
    }

    if (!this.usesCustomSerDes() && !this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval() && validationMode === 'none') {
      return makeClonedValueNoError(value);
    }

    let errorResult: InternalValidationErrorResult | undefined;

    let valueKeys: string[] = [];
    try {
      if (value !== null && typeof value === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        valueKeys = Object.keys(value);
      }
    } catch (_e) {
      // Ignoring just in case
    }

    const numValueKeys = valueKeys.length;

    const asyncTimeComplexityThreshold = getAsyncTimeComplexityThreshold();
    const chunkSize = Math.max(1, Math.floor(asyncTimeComplexityThreshold / this.estimatedValidationTimeComplexityPerItem_()));

    const keys = this.keys;
    const areKeysRegExps = keys instanceof RegExp;

    // If there are unknown keys, we'll deferred their processing until later so that other parallel models can do their updates first and
    // we can avoid unnecessary cloning
    const deferredUnknownKeys = new Set<string>();

    const processKey = (valueKey: string) => {
      if (areKeysRegExps) {
        if (!keys.test(valueKey)) {
          deferredUnknownKeys.add(valueKey);
          return undefined; // No validation necessary
        }
      } else {
        const result = (keys as any as InternalSchemaFunctions).internalValidateAsync(
          valueKey,
          internalState,
          appendPathComponent(path, valueKey),
          {},
          validationMode
        );
        return withResolved(result, (result) => {
          if (isErrorResult(result)) {
            deferredUnknownKeys.add(valueKey);
            return undefined; // No validation necessary
          }
        });
      }

      return undefined;
    };

    const processValue = (valueKey: string, value: any) => {
      const result = (this.valueSchema as any as InternalSchemaFunctions).internalValidateAsync(
        value,
        internalState,
        appendPathComponent(path, valueKey),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        container[valueKey] ?? {},
        validationMode
      );
      return withResolved(result, (result) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const bestResult = isErrorResult(result) ? (container[valueKey] ?? result.invalidValue()) : result.value;
        if (bestResult !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          container[valueKey] = bestResult;
        } else {
          delete container[valueKey];
        }

        if (isMoreSevereResult(result, errorResult)) {
          errorResult = result as InternalValidationErrorResult;

          if (shouldStopOnFirstError) {
            return errorResult;
          }
        }

        return undefined;
      });
    };

    const processIndex = (index: number) => {
      const valueKey = valueKeys[index];

      const processedKey = processKey(valueKey);
      return withResolved(processedKey, () =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        deferredUnknownKeys.has(valueKey) ? undefined : processValue(valueKey, value[valueKey])
      );
    };

    const processChunk = (chunkStartIndex: number) =>
      internalState.relaxIfNeeded(() =>
        forAsync(chunkStartIndex, (index) => index < Math.min(numValueKeys, chunkStartIndex + chunkSize), 1, processIndex)
      );

    const processedChunks = forAsync(0, (chunkStartIndex) => chunkStartIndex < numValueKeys, chunkSize, processChunk);
    return withResolved(processedChunks, (processedChunks) => {
      if (processedChunks !== undefined) {
        return { ...processedChunks, invalidValue: () => container };
      }

      if (this.allowUnknownKeys && deferredUnknownKeys.size > 0 && internalState.transformation !== 'none') {
        internalState.defer(() => {
          for (const key of deferredUnknownKeys) {
            if (!(key in container)) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              const cloned = safeClone(value[key]);
              if (cloned !== undefined) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                container[key] = cloned;
              }
            }
          }
        });
      }

      return errorResult !== undefined ? { ...errorResult, invalidValue: () => container } : makeNoError(container);
    });
  };

  protected override overridableGetExtraToStringFields = () => ({
    keys: this.keys,
    valueSchema: this.valueSchema
  });
}
