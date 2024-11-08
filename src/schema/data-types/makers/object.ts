import { getAsyncTimeComplexityThreshold } from '../../../config/async-time-complexity-threshold.js';
import { safeClone } from '../../../internal/utils/safeClone.js';
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
import { optional } from '../../marker-types/makers/optional.js';
import type { ObjectSchema } from '../types/ObjectSchema';

// DO NOT EXPORT THESE TYPES, IT MESSES UP TYPE INFERENCE

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

/** Requires an object.  Separate schemas a specified per key. */
export const object = <ObjectT extends Record<string, any>>(map: InferRecordOfSchemasFromRecordOfValues<ObjectT>): ObjectSchema<ObjectT> =>
  new ObjectSchemaImpl(map);

/** Creates an object type that extends another object type  */
export const extendsObject = <ExtendedObjectT extends Record<string, any>, ObjectT extends Record<string, any>>(
  baseSchema: ObjectSchema<ExtendedObjectT>,
  subSchema: ObjectSchema<ObjectT>
): ObjectSchema<ExtendedObjectT & ObjectT> =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  new ObjectSchemaImpl({
    ...baseSchema.map,
    ...subSchema.map
  }) as any;

/** Creates an object type that extends 2 other object types  */
export const extendsObject2 = <
  ExtendedObjectTA extends Record<string, any>,
  ExtendedObjectTB extends Record<string, any>,
  ObjectT extends Record<string, any>
>(
  baseSchemaA: ObjectSchema<ExtendedObjectTA>,
  baseSchemaB: ObjectSchema<ExtendedObjectTB>,
  subSchema: ObjectSchema<ObjectT>
): ObjectSchema<ExtendedObjectTA & ExtendedObjectTB & ObjectT> =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  new ObjectSchemaImpl({
    ...baseSchemaA.map,
    ...baseSchemaB.map,
    ...subSchema.map
  }) as any;

/** Creates an object type that extends 3 other object types  */
export const extendsObject3 = <
  ExtendedObjectTA extends Record<string, any>,
  ExtendedObjectTB extends Record<string, any>,
  ExtendedObjectTC extends Record<string, any>,
  ObjectT extends Record<string, any>
>(
  baseSchemaA: ObjectSchema<ExtendedObjectTA>,
  baseSchemaB: ObjectSchema<ExtendedObjectTB>,
  baseSchemaC: ObjectSchema<ExtendedObjectTC>,
  subSchema: ObjectSchema<ObjectT>
): ObjectSchema<ExtendedObjectTA & ExtendedObjectTB & ExtendedObjectTC & ObjectT> =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  new ObjectSchemaImpl({
    ...baseSchemaA.map,
    ...baseSchemaB.map,
    ...baseSchemaC.map,
    ...subSchema.map
  }) as any;

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

  public readonly setAllowUnknownKeys = (allow: boolean) => {
    this.allowUnknownKeys = allow;

    return this;
  };

  // Method Overrides

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
    if (this.allowUnknownKeys && internalState.transformation !== 'none') {
      internalState.defer(() => {
        allKeys = allKeys ?? Object.keys(value as object);
        for (const key of allKeys) {
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

        const result = await (schemaForKey as any as InternalSchemaFunctions).internalValidateAsync(
          valueForKey,
          internalState,
          appendPathComponent(path, key),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          container[key] ?? {},
          validationMode
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const bestResult = isErrorResult(result) ? (container[key] ?? result.invalidValue()) : result.value;
        if (bestResult !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          container[key] = bestResult;
        } else {
          delete container[key];
        }

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
