import _ from 'lodash';

import { getAsyncTimeComplexityThreshold } from '../../../config/async-time-complexity-threshold';
import { getMeaningfulTypeof } from '../../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../../types/schema';
import { InternalSchemaMakerImpl } from '../../internal/internal-schema-maker-impl';
import type { InternalSchemaFunctions } from '../../internal/types/internal-schema-functions';
import type { InternalAsyncValidator, InternalValidationErrorResult, InternalValidator } from '../../internal/types/internal-validation';
import { cloner } from '../../internal/utils/cloner';
import { copyMetaFields } from '../../internal/utils/copy-meta-fields';
import { isErrorResult } from '../../internal/utils/is-error-result';
import { isMoreSevereResult } from '../../internal/utils/is-more-severe-result';
import { makeErrorResultForValidationMode } from '../../internal/utils/make-error-result-for-validation-mode';
import { makeClonedValueNoError, makeNoError } from '../../internal/utils/make-no-error';
import { appendPathComponent } from '../../internal/utils/path-utils';
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

  public override readonly estimatedValidationTimeComplexity: number;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: boolean;

  public override readonly usesCustomSerDes: boolean;

  public override readonly isContainerType = true;

  // Private Fields

  private readonly estimatedValidationTimeComplexityPerItem_: number;

  // Initialization

  constructor(keys: RegExp | Schema<KeyT>, valueSchema: Schema<ValueT>) {
    super();

    this.keys = keys;
    this.valueSchema = valueSchema;

    const areKeysRegExps = keys instanceof RegExp;

    this.estimatedValidationTimeComplexityPerItem_ =
      (areKeysRegExps ? 1 : keys.estimatedValidationTimeComplexity) + valueSchema.estimatedValidationTimeComplexity;
    this.estimatedValidationTimeComplexity = this.estimatedValidationTimeComplexityPerItem_ * ESTIMATED_AVG_RECORD_SIZE;

    this.usesCustomSerDes = (!areKeysRegExps && keys.usesCustomSerDes) || valueSchema.usesCustomSerDes;
    this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval =
      (!areKeysRegExps && keys.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval) ||
      valueSchema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval;
  }

  // Public Methods

  public readonly clone = (): RecordSchema<KeyT, ValueT> => copyMetaFields({ from: this, to: record(this.keys, this.valueSchema) });

  public readonly setAllowUnknownKeys = (allow: boolean) => {
    this.allowUnknownKeys = allow;

    return this;
  };

  // Method Overrides

  protected override overridableInternalValidate: InternalValidator = (value, internalState, path, container, validationMode) => {
    const shouldStopOnFirstError =
      validationMode === 'hard' ||
      (!this.usesCustomSerDes && !this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && internalState.transformation === 'none');

    if (value === null || Array.isArray(value) || typeof value !== 'object') {
      return makeErrorResultForValidationMode(
        cloner(value),
        validationMode,
        () => `Expected object, found ${getMeaningfulTypeof(value)}`,
        path
      );
    }

    if (!this.usesCustomSerDes && !this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
      return makeClonedValueNoError(value);
    }

    let errorResult: InternalValidationErrorResult | undefined;

    let valueKeys: string[];
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      valueKeys = Object.keys(value);
    } catch (e) {
      // Ignoring just in case
      valueKeys = [];
    }

    const keys = this.keys;
    const areKeysRegExps = keys instanceof RegExp;

    for (const valueKey of valueKeys) {
      if (areKeysRegExps) {
        if (!keys.test(valueKey)) {
          if (this.allowUnknownKeys) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            container[valueKey] = container[valueKey] ?? _.cloneDeep(value[valueKey]);
          }
          continue; // No validation necessary
        }
      } else {
        const result = (keys as any as InternalSchemaFunctions).internalValidate(
          valueKey,
          internalState,
          appendPathComponent(path, valueKey),
          {},
          validationMode
        );
        if (isErrorResult(result)) {
          if (this.allowUnknownKeys) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            container[valueKey] = container[valueKey] ?? value[valueKey];
          }
          continue; // No validation necessary
        }
      }

      const result = (this.valueSchema as any as InternalSchemaFunctions).internalValidate(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        value[valueKey],
        internalState,
        appendPathComponent(path, valueKey),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        container[valueKey] ?? {},
        validationMode
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      container[valueKey] = isErrorResult(result) ? container[valueKey] ?? result.invalidValue() : result.value;
      if (isMoreSevereResult(result, errorResult)) {
        errorResult = result as InternalValidationErrorResult;

        if (shouldStopOnFirstError) {
          return { ...errorResult, invalidValue: () => container };
        }
      }
    }

    return errorResult !== undefined ? { ...errorResult, invalidValue: () => container } : makeNoError(container);
  };

  protected override overridableInternalValidateAsync: InternalAsyncValidator = async (
    value,
    internalState,
    path,
    container,
    validationMode
  ) => {
    const shouldStopOnFirstError =
      validationMode === 'hard' ||
      (!this.usesCustomSerDes && !this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && internalState.transformation === 'none');

    if (value === null || Array.isArray(value) || typeof value !== 'object') {
      return makeErrorResultForValidationMode(
        cloner(value),
        validationMode,
        () => `Expected object, found ${getMeaningfulTypeof(value)}`,
        path
      );
    }

    if (!this.usesCustomSerDes && !this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
      return makeClonedValueNoError(value);
    }

    let errorResult: InternalValidationErrorResult | undefined;

    let valueKeys: string[] = [];
    try {
      if (value !== null && typeof value === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        valueKeys = Object.keys(value);
      }
    } catch (e) {
      // Ignoring just in case
    }

    const numValueKeys = valueKeys.length;

    const asyncTimeComplexityThreshold = getAsyncTimeComplexityThreshold();
    const chunkSize = Math.max(1, Math.floor(asyncTimeComplexityThreshold / this.estimatedValidationTimeComplexityPerItem_));

    const keys = this.keys;
    const areKeysRegExps = keys instanceof RegExp;

    const processChunk = async (chunkStartIndex: number) => {
      if (internalState.shouldRelax()) {
        await internalState.relax();
      }

      for (let index = chunkStartIndex; index < numValueKeys && index < chunkStartIndex + chunkSize; index += 1) {
        const valueKey = valueKeys[index];

        if (areKeysRegExps) {
          if (!keys.test(valueKey)) {
            if (this.allowUnknownKeys) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              container[valueKey] = container[valueKey] ?? _.cloneDeep(value[valueKey]);
            }
            continue; // No validation necessary
          }
        } else {
          const result =
            keys.estimatedValidationTimeComplexity > asyncTimeComplexityThreshold
              ? await (keys as any as InternalSchemaFunctions).internalValidateAsync(
                  valueKey,
                  internalState,
                  appendPathComponent(path, valueKey),
                  {},
                  validationMode
                )
              : (keys as any as InternalSchemaFunctions).internalValidate(
                  valueKey,
                  internalState,
                  appendPathComponent(path, valueKey),
                  {},
                  validationMode
                );
          if (isErrorResult(result)) {
            if (this.allowUnknownKeys) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              container[valueKey] = container[valueKey] ?? value[valueKey];
            }
            continue; // No validation necessary
          }
        }

        const result =
          this.valueSchema.estimatedValidationTimeComplexity > asyncTimeComplexityThreshold
            ? await (this.valueSchema as any as InternalSchemaFunctions).internalValidateAsync(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                value[valueKey],
                internalState,
                appendPathComponent(path, valueKey),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                container[valueKey] ?? {},
                validationMode
              )
            : (this.valueSchema as any as InternalSchemaFunctions).internalValidate(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                value[valueKey],
                internalState,
                appendPathComponent(path, valueKey),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                container[valueKey] ?? {},
                validationMode
              );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        container[valueKey] = isErrorResult(result) ? container[valueKey] ?? result.invalidValue() : result.value;
        if (isMoreSevereResult(result, errorResult)) {
          errorResult = result as InternalValidationErrorResult;

          if (shouldStopOnFirstError) {
            return errorResult;
          }
        }
      }

      return undefined;
    };

    for (let chunkStartIndex = 0; chunkStartIndex < numValueKeys; chunkStartIndex += chunkSize) {
      const chunkRes = await processChunk(chunkStartIndex);
      if (chunkRes !== undefined) {
        return { ...chunkRes, invalidValue: () => container };
      }
    }

    return errorResult !== undefined ? { ...errorResult, invalidValue: () => container } : makeNoError(container);
  };

  protected override overridableGetExtraToStringFields = () => ({
    keys: this.keys,
    valueSchema: this.valueSchema
  });
}
