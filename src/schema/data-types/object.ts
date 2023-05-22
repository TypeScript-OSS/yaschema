import { getAsyncTimeComplexityThreshold } from '../../config/async-time-complexity-threshold';
import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { InternalSchemaMakerImpl } from '../internal/internal-schema-maker-impl';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type { InternalAsyncValidator, InternalValidationResult, InternalValidator } from '../internal/types/internal-validation';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { getValidationMode } from '../internal/utils/get-validation-mode';
import { isMoreSevereResult } from '../internal/utils/is-more-severe-result';
import { makeErrorResultForValidationMode } from '../internal/utils/make-error-result-for-validation-mode';
import { appendPathComponent } from '../internal/utils/path-utils';
import { updateUnknownKeysForPath } from '../internal/utils/update-unknown-keys-for-path';
import { optional } from '../marker-types/optional';

/** Infers a record where the values of the original type are inferred to be the values of `Schemas` */
type InferRecordOfSchemasFromRecordOfValues<ObjectT extends Record<string, any>> = {
  [KeyT in keyof ObjectT]: Schema<ObjectT[KeyT]>;
};

/** Picks the fields of an object type that are never undefined */
type PickAlwaysDefinedValues<Base> = Pick<
  Base,
  {
    [Key in keyof Base]: Base[Key] extends Exclude<Base[Key], undefined> ? Key : never;
  }[keyof Base]
>;

/** Picks the fields of an object type that might be undefined */
type PickPossiblyUndefinedValues<Base> = Omit<Base, keyof PickAlwaysDefinedValues<Base>>;

/** Converts types like `{ x: string, y: string | undefined }` to types like `{ x: string, y?: string }` */
type TreatUndefinedAsOptional<ObjectT extends Record<string, any>> = PickAlwaysDefinedValues<ObjectT> &
  Partial<PickPossiblyUndefinedValues<ObjectT>>;

/** Requires an object, where each key has it's own schema. */
export interface ObjectSchema<ObjectT extends Record<string, any>> extends Schema<TreatUndefinedAsOptional<ObjectT>> {
  schemaType: 'object';
  clone: () => ObjectSchema<ObjectT>;

  map: InferRecordOfSchemasFromRecordOfValues<ObjectT>;
}

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

  // Initialization

  constructor(map: InferRecordOfSchemasFromRecordOfValues<ObjectT>) {
    super();

    this.map = map;

    this.mapKeys_ = Object.keys(map);

    const mapValues = Object.values(map) as Schema[];

    this.estimatedValidationTimeComplexity = mapValues.reduce((out, schema) => {
      out += schema.estimatedValidationTimeComplexity;

      return out;
    }, 0);

    this.usesCustomSerDes = mapValues.findIndex((schema) => schema.usesCustomSerDes) >= 0;
  }

  // Public Methods

  public readonly clone = (): ObjectSchema<ObjectT> => copyMetaFields({ from: this, to: object(this.map) });

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

    if (validatorOptions.shouldProcessUnknownKeys) {
      updateUnknownKeysForPath({ validatorOptions, path, value: value as Record<string, any>, mapKeys: this.mapKeys_ });
    }

    let errorResult: InternalValidationResult | undefined;

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
        validatorOptions,
        appendPathComponent(path, key)
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

    if (validatorOptions.shouldProcessUnknownKeys) {
      updateUnknownKeysForPath({ validatorOptions, path, value: value as Record<string, any>, mapKeys: this.mapKeys_ });
    }

    let errorResult: InternalValidationResult | undefined;

    const asyncTimeComplexityThreshold = getAsyncTimeComplexityThreshold();
    const numKeys = this.mapKeys_.length;

    let chunkStartIndex = 0;
    const processChunk = async () => {
      if (validatorOptions.shouldRelax()) {
        await validatorOptions.relax();
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
                validatorOptions,
                appendPathComponent(path, key)
              )
            : (schemaForKey as any as InternalSchemaFunctions).internalValidate(
                valueForKey,
                validatorOptions,
                appendPathComponent(path, key)
              );
        if (isMoreSevereResult(result, errorResult)) {
          errorResult = result;

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
        return chunkRes;
      }
    }

    return errorResult ?? noError;
  };

  protected override overridableGetExtraToStringFields = () => ({
    map: this.map
  });
}
