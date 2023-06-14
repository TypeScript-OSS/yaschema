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
import { optional } from '../../marker-types/optional';
import type { InferRecordOfSchemasFromRecordOfValues, ObjectSchema, TreatUndefinedAsOptional } from '../types/ObjectSchema';

/** Requires an object.  Separate schemas a specified per key. */
export const object = <ObjectT extends Record<string, any>>(map: InferRecordOfSchemasFromRecordOfValues<ObjectT>): ObjectSchema<ObjectT> =>
  new ObjectSchemaImpl(map);

/** Creates a version of the specified object schema where all values are optional.  This doesn't create a distinct schema type.  */
export const partial = <ObjectT extends Record<string, any>>(schema: ObjectSchema<ObjectT>): ObjectSchema<Partial<ObjectT>> => {
  const outputMap: Partial<InferRecordOfSchemasFromRecordOfValues<Partial<ObjectT>>> = {};
  for (const key of Object.keys(schema.map) as Array<keyof typeof schema.map>) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    outputMap[key] = optional(schema.map[key]) as any;
  }

  return new ObjectSchemaImpl<Partial<ObjectT>>(outputMap as InferRecordOfSchemasFromRecordOfValues<Partial<ObjectT>>);
};

/** Creates a version of the specified object schema with the same number or fewer keys, by picking keys */
export const pick = <ObjectT extends Record<string, any>, KeyT extends keyof ObjectT>(
  schema: ObjectSchema<ObjectT>,
  pickedKeys: KeyT[]
): ObjectSchema<Pick<ObjectT, KeyT>> => {
  const pickedKeysSet = new Set<keyof ObjectT>(pickedKeys);

  const outputMap: Partial<InferRecordOfSchemasFromRecordOfValues<Pick<ObjectT, KeyT>>> = {};
  for (const key of Object.keys(schema.map) as Array<keyof typeof schema.map>) {
    if (pickedKeysSet.has(key)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      outputMap[key as KeyT] = schema.map[key] as any;
    }
  }

  return new ObjectSchemaImpl<Pick<ObjectT, KeyT>>(outputMap as InferRecordOfSchemasFromRecordOfValues<Pick<ObjectT, KeyT>>);
};

/** Creates a version of the specified object schema with the same number or fewer keys, by omitting keys */
export const omit = <ObjectT extends Record<string, any>, KeyT extends keyof ObjectT>(
  schema: ObjectSchema<ObjectT>,
  omittedKeys: KeyT[]
): ObjectSchema<Omit<ObjectT, KeyT>> => {
  const omittedKeysSet = new Set<keyof ObjectT>(omittedKeys);

  const outputMap: Partial<InferRecordOfSchemasFromRecordOfValues<Omit<ObjectT, KeyT>>> = {};
  for (const key of Object.keys(schema.map) as Array<keyof typeof schema.map>) {
    if (!omittedKeysSet.has(key)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      outputMap[key as Exclude<keyof ObjectT, KeyT>] = schema.map[key] as any;
    }
  }

  return new ObjectSchemaImpl<Omit<ObjectT, KeyT>>(outputMap as InferRecordOfSchemasFromRecordOfValues<Omit<ObjectT, KeyT>>);
};

// Helpers

class ObjectSchemaImpl<ObjectT extends Record<string, any>>
  extends InternalSchemaMakerImpl<TreatUndefinedAsOptional<ObjectT>>
  implements ObjectSchema<ObjectT>
{
  // Public Fields

  public allowUnknownKeys = false;

  public readonly map: InferRecordOfSchemasFromRecordOfValues<ObjectT>;

  // PureSchema Field Overrides

  public override readonly schemaType = 'object';

  public override readonly valueType = undefined as any as ObjectT;

  public override readonly estimatedValidationTimeComplexity: number;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: boolean = true;

  public override readonly usesCustomSerDes: boolean;

  public override readonly isContainerType = true;

  // Private Fields

  private readonly mapKeys_: string[];

  private readonly mapKeysSet_: Set<string>;

  // Initialization

  constructor(map: InferRecordOfSchemasFromRecordOfValues<ObjectT>) {
    super();

    this.map = map;

    this.mapKeys_ = Object.keys(map);
    this.mapKeysSet_ = new Set(this.mapKeys_);

    const mapValues = Object.values(map) as Schema[];

    this.estimatedValidationTimeComplexity = mapValues.reduce((out, schema) => {
      out += schema.estimatedValidationTimeComplexity;

      return out;
    }, 0);

    this.usesCustomSerDes = mapValues.findIndex((schema) => schema.usesCustomSerDes) >= 0;
  }

  // Public Methods

  public readonly clone = (): ObjectSchema<ObjectT> => copyMetaFields({ from: this, to: object(this.map) });

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

    let allKeys: string[] | undefined;
    if (this.allowUnknownKeys) {
      allKeys = allKeys ?? Object.keys(value as object);
      for (const key of allKeys) {
        if (!this.mapKeysSet_.has(key)) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          container[key] = container[key] ?? _.cloneDeep(value[key]);
        }
      }
    }

    for (const key of this.mapKeys_) {
      let valueForKey = undefined;
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        valueForKey = value[key];
      } catch (e) {
        // Ignoring just in case
      }

      const result = (this.map[key] as any as InternalSchemaFunctions).internalValidate(
        valueForKey,
        internalState,
        appendPathComponent(path, key),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        container[key] ?? {},
        validationMode
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      container[key] = isErrorResult(result) ? container[key] ?? result.invalidValue() : result.value;
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

    const asyncTimeComplexityThreshold = getAsyncTimeComplexityThreshold();
    const keys = this.mapKeys_;
    const numKeys = keys.length;

    let allKeys: string[] | undefined;
    if (this.allowUnknownKeys) {
      allKeys = allKeys ?? Object.keys(value as object);
      for (const key of allKeys) {
        if (!this.mapKeysSet_.has(key)) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          container[key] = container[key] ?? _.cloneDeep(value[key]);
        }
      }
    }

    let chunkStartIndex = 0;
    const processChunk = async () => {
      if (internalState.shouldRelax()) {
        await internalState.relax();
      }

      let estimatedValidationTimeComplexityForKeys = 0;
      const chunkKeys: string[] = [];
      let index = chunkStartIndex;
      while (chunkKeys.length === 0 || (estimatedValidationTimeComplexityForKeys <= asyncTimeComplexityThreshold && index < numKeys)) {
        const key = this.mapKeys_[index];
        estimatedValidationTimeComplexityForKeys += this.map[key].estimatedValidationTimeComplexity;
        chunkKeys.push(key);

        index += 1;
      }

      for (const key of chunkKeys) {
        let valueForKey = undefined;
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          valueForKey = value[key];
        } catch (e) {
          // Ignoring just in case
        }

        const schemaForKey = this.map[key];

        const result =
          schemaForKey.estimatedValidationTimeComplexity > asyncTimeComplexityThreshold
            ? await (schemaForKey as any as InternalSchemaFunctions).internalValidateAsync(
                valueForKey,
                internalState,
                appendPathComponent(path, key),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                container[key] ?? {},
                validationMode
              )
            : (schemaForKey as any as InternalSchemaFunctions).internalValidate(
                valueForKey,
                internalState,
                appendPathComponent(path, key),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                container[key] ?? {},
                validationMode
              );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        container[key] = isErrorResult(result) ? container[key] ?? result.invalidValue() : result.value;
        if (isMoreSevereResult(result, errorResult)) {
          errorResult = result as InternalValidationErrorResult;

          if (shouldStopOnFirstError) {
            return errorResult;
          }
        }
      }

      chunkStartIndex += chunkKeys.length;

      return undefined;
    };

    while (chunkStartIndex < numKeys) {
      const chunkRes = await processChunk();
      if (chunkRes !== undefined) {
        return { ...chunkRes, invalidValue: () => container };
      }
    }

    return errorResult !== undefined ? { ...errorResult, invalidValue: () => container } : makeNoError(container);
  };

  protected override overridableGetExtraToStringFields = () => ({
    map: this.map
  });
}
