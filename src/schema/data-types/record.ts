import { getAsyncTimeComplexityThreshold } from '../../config/async-time-complexity-threshold';
import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { InternalSchemaMakerImpl } from '../internal/internal-schema-maker-impl';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type { InternalAsyncValidator, InternalValidationResult, InternalValidator } from '../internal/types/internal-validation';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { getValidationMode } from '../internal/utils/get-validation-mode';
import { isErrorResult } from '../internal/utils/is-error-result';
import { isMoreSevereResult } from '../internal/utils/is-more-severe-result';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';
import { appendPathComponent } from '../internal/utils/path-utils';

const ESTIMATED_AVG_RECORD_SIZE = 25;

/** Requires a non-null, non-array object where all keys share a schema and all values share a schema */
export interface RecordSchema<KeyT extends string, ValueT> extends Schema<Partial<Record<KeyT, ValueT>>> {
  schemaType: 'record';
  clone: () => RecordSchema<KeyT, ValueT>;

  keys: RegExp | Schema<KeyT>;
  valueSchema: Schema<ValueT>;
}

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

  // Method Overrides

  protected override overridableInternalValidate: InternalValidator = (value, validatorOptions, path) => {
    const validationMode = getValidationMode(validatorOptions);
    const shouldStopOnFirstError =
      validationMode === 'hard' || (!this.usesCustomSerDes && !this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval);

    if (value === null || Array.isArray(value) || typeof value !== 'object') {
      return makeErrorResultForValidationMode(validationMode, () => `Expected object, found ${getMeaningfulTypeof(value)}`, path);
    }

    if (!this.usesCustomSerDes && !this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
      return noError;
    }

    let errorResult: InternalValidationResult | undefined;

    let valueKeys: string[];
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      valueKeys = Object.keys(value);
    } catch (e) {
      // Ignoring just in case
      valueKeys = [];
    }

    let unknownKeysSet: Set<string> | undefined;
    if (validatorOptions.shouldProcessUnknownKeys) {
      unknownKeysSet = validatorOptions.registerPotentiallyUnknownKeysForPath(path, () => new Set(valueKeys));
    }

    const keys = this.keys;
    const areKeysRegExps = keys instanceof RegExp;

    for (const valueKey of valueKeys) {
      if (areKeysRegExps) {
        if (!keys.test(valueKey)) {
          // Skipping value validation for key not defined in this record type -- because we allow arbitrary extra keys
          continue;
        } else {
          unknownKeysSet?.delete(valueKey);
        }
      } else {
        const result = (keys as any as InternalSchemaFunctions).internalValidate(
          valueKey,
          validatorOptions,
          appendPathComponent(path, valueKey)
        );
        if (isErrorResult(result)) {
          // Skipping value validation for key not defined in this record type -- because we allow arbitrary extra keys
          continue;
        } else {
          unknownKeysSet?.delete(valueKey);
        }
      }

      const result = (this.valueSchema as any as InternalSchemaFunctions).internalValidate(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        value[valueKey],
        validatorOptions,
        appendPathComponent(path, valueKey)
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

  protected override overridableInternalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) => {
    const validationMode = getValidationMode(validatorOptions);
    const shouldStopOnFirstError =
      validationMode === 'hard' || (!this.usesCustomSerDes && !this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval);

    if (value === null || Array.isArray(value) || typeof value !== 'object') {
      return makeErrorResultForValidationMode(validationMode, () => `Expected object, found ${getMeaningfulTypeof(value)}`, path);
    }

    if (!this.usesCustomSerDes && !this.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
      return noError;
    }

    let errorResult: InternalValidationResult | undefined;

    let valueKeys: string[] = [];
    try {
      if (value !== null && typeof value === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        valueKeys = Object.keys(value);
      }
    } catch (e) {
      // Ignoring just in case
    }

    let unknownKeysSet: Set<string> | undefined;
    if (validatorOptions.shouldProcessUnknownKeys) {
      unknownKeysSet = validatorOptions.registerPotentiallyUnknownKeysForPath(path, () => new Set(valueKeys));
    }

    const numValueKeys = valueKeys.length;

    const asyncTimeComplexityThreshold = getAsyncTimeComplexityThreshold();
    const chunkSize = Math.max(1, Math.floor(asyncTimeComplexityThreshold / this.estimatedValidationTimeComplexityPerItem_));

    const keys = this.keys;
    const areKeysRegExps = keys instanceof RegExp;

    const processChunk = async (chunkStartIndex: number) => {
      if (validatorOptions.shouldRelax()) {
        await validatorOptions.relax();
      }

      for (let index = chunkStartIndex; index < numValueKeys && index < chunkStartIndex + chunkSize; index += 1) {
        const valueKey = valueKeys[index];

        if (areKeysRegExps) {
          if (!keys.test(valueKey)) {
            // Skipping value validation for key not defined in this record type -- because we allow arbitrary extra keys
            continue;
          } else {
            unknownKeysSet?.delete(valueKey);
          }
        } else {
          const result =
            keys.estimatedValidationTimeComplexity > asyncTimeComplexityThreshold
              ? await (keys as any as InternalSchemaFunctions).internalValidateAsync(
                  valueKey,
                  validatorOptions,
                  appendPathComponent(path, valueKey)
                )
              : (keys as any as InternalSchemaFunctions).internalValidate(valueKey, validatorOptions, appendPathComponent(path, valueKey));
          if (isErrorResult(result)) {
            // Skipping value validation for key not defined in this record type -- because we allow arbitrary extra keys
            continue;
          } else {
            unknownKeysSet?.delete(valueKey);
          }
        }

        const result =
          this.valueSchema.estimatedValidationTimeComplexity > asyncTimeComplexityThreshold
            ? await (this.valueSchema as any as InternalSchemaFunctions).internalValidateAsync(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                value[valueKey],
                validatorOptions,
                appendPathComponent(path, valueKey)
              )
            : (this.valueSchema as any as InternalSchemaFunctions).internalValidate(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                value[valueKey],
                validatorOptions,
                appendPathComponent(path, valueKey)
              );
        if (isMoreSevereResult(result, errorResult)) {
          errorResult = result;

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
        chunkRes;
      }
    }

    return errorResult ?? noError;
  };

  protected override overridableGetExtraToStringFields = () => ({
    keys: this.keys,
    valueSchema: this.valueSchema
  });
}
