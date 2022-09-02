import { getAsyncTimeComplexityThreshold } from '../../config/async-time-complexity-threshold';
import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { makeInternalSchema } from '../internal/internal-schema-maker';
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
export const record = <KeyT extends string, ValueT>(
  keys: RegExp | Schema<KeyT>,
  valueSchema: Schema<ValueT>
): RecordSchema<KeyT, ValueT> => {
  const estimatedValidationTimeComplexityPerItem =
    (keys instanceof RegExp ? 1 : keys.estimatedValidationTimeComplexity) + valueSchema.estimatedValidationTimeComplexity;
  const needsDeepSerDes = (!(keys instanceof RegExp) && keys.usesCustomSerDes) || valueSchema.usesCustomSerDes;
  const isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval =
    (!(keys instanceof RegExp) && keys.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval) ||
    valueSchema.isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval;

  const internalValidate: InternalValidator = (value, validatorOptions, path) => {
    const validationMode = getValidationMode(validatorOptions);
    const shouldStopOnFirstError =
      validationMode === 'hard' || (!needsDeepSerDes && !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval);

    if (value === null || Array.isArray(value) || typeof value !== 'object') {
      return makeErrorResultForValidationMode(validationMode, () => `Expected object, found ${getMeaningfulTypeof(value)}`, path);
    }

    if (!needsDeepSerDes && !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
      return noError;
    }

    if (validatorOptions.shouldRemoveUnknownKeys) {
      validatorOptions.inoutUnknownKeysByPath[path] = 'allow-all';
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

    for (const valueKey of valueKeys) {
      if (keys instanceof RegExp) {
        if (!keys.test(valueKey)) {
          // Skipping value validation for key not defined in this record type -- because we allow arbitrary extra keys
          continue;
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
        }
      }

      const result = (valueSchema as any as InternalSchemaFunctions).internalValidate(
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
  const internalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) => {
    const validationMode = getValidationMode(validatorOptions);
    const shouldStopOnFirstError =
      validationMode === 'hard' || (!needsDeepSerDes && !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval);

    if (value === null || Array.isArray(value) || typeof value !== 'object') {
      return makeErrorResultForValidationMode(validationMode, () => `Expected object, found ${getMeaningfulTypeof(value)}`, path);
    }

    if (!needsDeepSerDes && !isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval && validationMode === 'none') {
      return noError;
    }

    if (validatorOptions.shouldRemoveUnknownKeys) {
      validatorOptions.inoutUnknownKeysByPath[path] = 'allow-all';
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

    const numValueKeys = valueKeys.length;

    const asyncTimeComplexityThreshold = getAsyncTimeComplexityThreshold();
    const chunkSize = Math.max(1, Math.floor(asyncTimeComplexityThreshold / estimatedValidationTimeComplexityPerItem));

    const processChunk = async (chunkStartIndex: number) => {
      if (validatorOptions.shouldYield()) {
        await validatorOptions.yield();
      }

      for (let index = chunkStartIndex; index < numValueKeys && index < chunkStartIndex + chunkSize; index += 1) {
        const valueKey = valueKeys[index];

        if (keys instanceof RegExp) {
          if (!keys.test(valueKey)) {
            // Skipping value validation for key not defined in this record type -- because we allow arbitrary extra keys
            continue;
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
          }
        }

        const result =
          valueSchema.estimatedValidationTimeComplexity > asyncTimeComplexityThreshold
            ? await (valueSchema as any as InternalSchemaFunctions).internalValidateAsync(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                value[valueKey],
                validatorOptions,
                appendPathComponent(path, valueKey)
              )
            : (valueSchema as any as InternalSchemaFunctions).internalValidate(
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

  const fullSchema: RecordSchema<KeyT, ValueT> = makeInternalSchema(
    {
      valueType: undefined as any as Partial<Record<KeyT, ValueT>>,
      schemaType: 'record',
      clone: () => copyMetaFields({ from: fullSchema, to: record(fullSchema.keys, fullSchema.valueSchema) }),
      keys,
      valueSchema,
      estimatedValidationTimeComplexity: estimatedValidationTimeComplexityPerItem * ESTIMATED_AVG_RECORD_SIZE,
      isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval,
      usesCustomSerDes: needsDeepSerDes
    },
    { internalValidate, internalValidateAsync }
  );

  return fullSchema;
};
