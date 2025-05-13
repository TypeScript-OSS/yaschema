import { getAsyncTimeComplexityThreshold } from '../../../config/async-time-complexity-threshold.js';
import { forOfAsync } from '../../../internal/utils/forOfAsync.js';
import { once } from '../../../internal/utils/once.js';
import { safeClone } from '../../../internal/utils/safeClone.js';
import { whileAsync } from '../../../internal/utils/whileAsync.js';
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
import { optional } from '../../marker-types/makers/optional.js';
import type { AnyObjectSchema, ObjectSchema, ObjectSchema_noAutoOptional } from '../types/ObjectSchema';

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

/** Requires an object.  Separate schemas a specified per key.  The keys of values that may be `undefined` are treated as optional. */
export const object = <ObjectT extends Record<string, any>>(map: InferRecordOfSchemasFromRecordOfValues<ObjectT>): ObjectSchema<ObjectT> =>
  new ObjectSchemaImpl<ObjectT>(map);

/** Requires an object.  Separate schemas a specified per key.  Unlike with `object`, the keys of values that may be `undefined` are not
 * automatically treated as optional.  You may explicitly provide a type parameter when using `…_noAutoOptional` methods, and that may
 * include optional keys. */
export const object_noAutoOptional = <ObjectT extends Record<string, any>>(
  map: InferRecordOfSchemasFromRecordOfValues<ObjectT>
): ObjectSchema_noAutoOptional<ObjectT> => new ObjectSchemaImpl_noAutoOptional<ObjectT>(map);

/** Creates an object type that extends another object type.  The keys of values that may be `undefined` are treated as optional. */
export const extendsObject = <ExtendedObjectT extends Record<string, any>, ObjectT extends Record<string, any>>(
  baseSchema: AnyObjectSchema<ExtendedObjectT>,
  subSchema: AnyObjectSchema<ObjectT>
): ObjectSchema<ExtendedObjectT & ObjectT> =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  new ObjectSchemaImpl({
    ...baseSchema.map,
    ...subSchema.map
  }) as any;

/** Creates an object type that extends another object type.  Unlike with `extendsObject`, the keys of values that may be `undefined` are
 * not automatically treated as optional.  You may explicitly provide type parameters when using `…_noAutoOptional` methods, and those may
 * include optional keys. */
export const extendsObject_noAutoOptional = <ExtendedObjectT extends Record<string, any>, ObjectT extends Record<string, any>>(
  baseSchema: AnyObjectSchema<ExtendedObjectT>,
  subSchema: AnyObjectSchema<ObjectT>
): ObjectSchema_noAutoOptional<ExtendedObjectT & ObjectT> =>
  new ObjectSchemaImpl_noAutoOptional<ExtendedObjectT & ObjectT>({
    ...baseSchema.map,
    ...subSchema.map
  } as ExtendedObjectT & ObjectT);

/** Creates an object type that extends 2 other object types  */
export const extendsObject2 = <
  ExtendedObjectTA extends Record<string, any>,
  ExtendedObjectTB extends Record<string, any>,
  ObjectT extends Record<string, any>
>(
  baseSchemaA: AnyObjectSchema<ExtendedObjectTA>,
  baseSchemaB: AnyObjectSchema<ExtendedObjectTB>,
  subSchema: AnyObjectSchema<ObjectT>
): ObjectSchema<ExtendedObjectTA & ExtendedObjectTB & ObjectT> =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  new ObjectSchemaImpl({
    ...baseSchemaA.map,
    ...baseSchemaB.map,
    ...subSchema.map
  }) as any;

/** Creates an object type that extends 2 other object types  */
export const extendsObject2_noAutoOptional = <
  ExtendedObjectTA extends Record<string, any>,
  ExtendedObjectTB extends Record<string, any>,
  ObjectT extends Record<string, any>
>(
  baseSchemaA: AnyObjectSchema<ExtendedObjectTA>,
  baseSchemaB: AnyObjectSchema<ExtendedObjectTB>,
  subSchema: AnyObjectSchema<ObjectT>
): ObjectSchema_noAutoOptional<ExtendedObjectTA & ExtendedObjectTB & ObjectT> =>
  new ObjectSchemaImpl_noAutoOptional<ExtendedObjectTA & ExtendedObjectTB & ObjectT>({
    ...baseSchemaA.map,
    ...baseSchemaB.map,
    ...subSchema.map
  } as ExtendedObjectTA & ExtendedObjectTB & ObjectT);

/** Creates an object type that extends 3 other object types  */
export const extendsObject3 = <
  ExtendedObjectTA extends Record<string, any>,
  ExtendedObjectTB extends Record<string, any>,
  ExtendedObjectTC extends Record<string, any>,
  ObjectT extends Record<string, any>
>(
  baseSchemaA: AnyObjectSchema<ExtendedObjectTA>,
  baseSchemaB: AnyObjectSchema<ExtendedObjectTB>,
  baseSchemaC: AnyObjectSchema<ExtendedObjectTC>,
  subSchema: AnyObjectSchema<ObjectT>
): ObjectSchema<ExtendedObjectTA & ExtendedObjectTB & ExtendedObjectTC & ObjectT> =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  new ObjectSchemaImpl({
    ...baseSchemaA.map,
    ...baseSchemaB.map,
    ...baseSchemaC.map,
    ...subSchema.map
  }) as any;

/** Creates an object type that extends 3 other object types  */
export const extendsObject3_noAutoOptional = <
  ExtendedObjectTA extends Record<string, any>,
  ExtendedObjectTB extends Record<string, any>,
  ExtendedObjectTC extends Record<string, any>,
  ObjectT extends Record<string, any>
>(
  baseSchemaA: AnyObjectSchema<ExtendedObjectTA>,
  baseSchemaB: AnyObjectSchema<ExtendedObjectTB>,
  baseSchemaC: AnyObjectSchema<ExtendedObjectTC>,
  subSchema: AnyObjectSchema<ObjectT>
): ObjectSchema_noAutoOptional<ExtendedObjectTA & ExtendedObjectTB & ExtendedObjectTC & ObjectT> =>
  new ObjectSchemaImpl_noAutoOptional<ExtendedObjectTA & ExtendedObjectTB & ExtendedObjectTC & ObjectT>({
    ...baseSchemaA.map,
    ...baseSchemaB.map,
    ...baseSchemaC.map,
    ...subSchema.map
  } as ExtendedObjectTA & ExtendedObjectTB & ExtendedObjectTC & ObjectT);

/** Creates a version of the specified object schema where all values are optional.  This doesn't create a distinct schema type.  */
export const partial = <ObjectT extends Record<string, any>>(schema: AnyObjectSchema<ObjectT>): ObjectSchema<Partial<ObjectT>> => {
  const outputMap: Partial<InferRecordOfSchemasFromRecordOfValues<Partial<ObjectT>>> = {};
  for (const key of Object.keys(schema.map) as Array<keyof typeof schema.map>) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    outputMap[key] = optional(schema.map[key]) as any;
  }

  return new ObjectSchemaImpl<Partial<ObjectT>>(outputMap as InferRecordOfSchemasFromRecordOfValues<Partial<ObjectT>>);
};

/** Creates a version of the specified object schema with the same number or fewer keys, by picking keys.  The keys of values that may be
 * `undefined` are treated as optional. */
export const pick = <ObjectT extends Record<string, any>, KeyT extends keyof ObjectT>(
  schema: AnyObjectSchema<ObjectT>,
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

/** Creates a version of the specified object schema with the same number or fewer keys, by picking keys.  Unlike with `pick`, the keys of
 * values that may be `undefined` are not automatically treated as optional.  You may explicitly provide type parameters when using
 * `…_noAutoOptional` methods, and those may include optional keys. */
export const pick_noAutoOptional = <ObjectT extends Record<string, any>, KeyT extends keyof ObjectT>(
  schema: AnyObjectSchema<ObjectT>,
  pickedKeys: KeyT[]
): ObjectSchema_noAutoOptional<Pick<ObjectT, KeyT>> => {
  const pickedKeysSet = new Set<keyof ObjectT>(pickedKeys);

  const outputMap: Partial<InferRecordOfSchemasFromRecordOfValues<Pick<ObjectT, KeyT>>> = {};
  for (const key of Object.keys(schema.map) as Array<keyof typeof schema.map>) {
    if (pickedKeysSet.has(key)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      outputMap[key as KeyT] = schema.map[key] as any;
    }
  }

  return new ObjectSchemaImpl_noAutoOptional<Pick<ObjectT, KeyT>>(outputMap as InferRecordOfSchemasFromRecordOfValues<Pick<ObjectT, KeyT>>);
};

/** Creates a version of the specified object schema with the same number or fewer keys, by omitting keys.  The keys of values that may be
 * `undefined` are treated as optional. */
export const omit = <ObjectT extends Record<string, any>, KeyT extends keyof ObjectT>(
  schema: AnyObjectSchema<ObjectT>,
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

  return new ObjectSchemaImpl<Omit<ObjectT, KeyT>>(
    outputMap as InferRecordOfSchemasFromRecordOfValues<Omit<ObjectT, KeyT>>
  ) as any as ObjectSchema<Omit<ObjectT, KeyT>>;
};

/** Creates a version of the specified object schema with the same number or fewer keys, by omitting keys.  Unlike with `omit`, the keys of
 * values that may be `undefined` are not automatically treated as optional.  You may explicitly provide type parameters when using
 * `…_noAutoOptional` methods, and those may include optional keys. */
export const omit_noAutoOptional = <ObjectT extends Record<string, any>, KeyT extends keyof ObjectT>(
  schema: AnyObjectSchema<ObjectT>,
  omittedKeys: KeyT[]
): ObjectSchema_noAutoOptional<Omit<ObjectT, KeyT>> => {
  const omittedKeysSet = new Set<keyof ObjectT>(omittedKeys);

  const outputMap: Partial<InferRecordOfSchemasFromRecordOfValues<Omit<ObjectT, KeyT>>> = {};
  for (const key of Object.keys(schema.map) as Array<keyof typeof schema.map>) {
    if (!omittedKeysSet.has(key)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      outputMap[key as Exclude<keyof ObjectT, KeyT>] = schema.map[key] as any;
    }
  }

  return new ObjectSchemaImpl_noAutoOptional<Omit<ObjectT, KeyT>>(
    outputMap as InferRecordOfSchemasFromRecordOfValues<Omit<ObjectT, KeyT>>
  ) as any as ObjectSchema_noAutoOptional<Omit<ObjectT, KeyT>>;
};

// Helpers

abstract class BaseObjectSchemaImpl<ObjectT extends Record<string, any>, ValueT> extends InternalSchemaMakerImpl<ValueT> {
  // Public Fields

  public allowUnknownKeys = false;

  public readonly map: InferRecordOfSchemasFromRecordOfValues<ObjectT>;

  // PureSchema Field Overrides

  public override readonly schemaType = 'object';

  public override readonly valueType = undefined as any as ValueT;

  public override readonly estimatedValidationTimeComplexity;

  public override readonly isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval = () => true;

  public override readonly usesCustomSerDes;

  // Private Fields

  private readonly mapKeys_: string[];

  // Initialization

  constructor(map: InferRecordOfSchemasFromRecordOfValues<ObjectT>) {
    super();

    this.map = map;

    this.mapKeys_ = Object.keys(map);

    const mapValues = Object.values(map) as Schema[];

    this.estimatedValidationTimeComplexity = once(() =>
      mapValues.reduce((out, schema) => {
        out += schema.estimatedValidationTimeComplexity();

        return out;
      }, 0)
    );

    this.usesCustomSerDes = once(() => mapValues.findIndex((schema) => schema.usesCustomSerDes()) >= 0);
  }

  // Public Methods

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

    const processKey = (key: string) => {
      let valueForKey = undefined;
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        valueForKey = value[key];
      } catch (_e) {
        // Ignoring just in case
      }

      const schemaForKey = this.map[key];

      const result = (schemaForKey as any as InternalSchemaFunctions).internalValidateAsync(
        valueForKey,
        internalState,
        appendPathComponent(path, key),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        container[key] ?? {},
        validationMode
      );
      return withResolved(result, (result) => {
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

        return undefined;
      });
    };

    let chunkStartIndex = 0;
    const processChunk = () =>
      internalState.relaxIfNeeded(() => {
        let estimatedValidationTimeComplexityForKeys = 0;
        const chunkKeys: string[] = [];
        let index = chunkStartIndex;
        while (chunkKeys.length === 0 || (estimatedValidationTimeComplexityForKeys <= asyncTimeComplexityThreshold && index < numKeys)) {
          const key = this.mapKeys_[index];
          estimatedValidationTimeComplexityForKeys += this.map[key].estimatedValidationTimeComplexity();
          chunkKeys.push(key);

          index += 1;
        }

        const processedKeys = forOfAsync(chunkKeys, processKey);
        return withResolved(processedKeys, (processedKeys) => {
          if (processedKeys !== undefined) {
            return processedKeys;
          }

          chunkStartIndex += chunkKeys.length;

          return undefined;
        });
      });

    const processedChunks = whileAsync(() => chunkStartIndex < numKeys, processChunk);
    return withResolved(processedChunks, (processedChunks) => {
      if (processedChunks !== undefined) {
        return { ...processedChunks, invalidValue: () => container };
      }

      return errorResult !== undefined ? { ...errorResult, invalidValue: () => container } : makeNoError(container);
    });
  };

  protected override overridableGetExtraToStringFields = () => ({
    map: this.map
  });
}

class ObjectSchemaImpl<ObjectT extends Record<string, any>>
  extends BaseObjectSchemaImpl<ObjectT, TreatUndefinedAsOptional<ObjectT>>
  implements ObjectSchema<ObjectT>
{
  public readonly clone = (): ObjectSchema<ObjectT> => copyMetaFields({ from: this, to: object(this.map) });
}

class ObjectSchemaImpl_noAutoOptional<ObjectT extends Record<string, any>>
  extends BaseObjectSchemaImpl<ObjectT, ObjectT>
  implements ObjectSchema_noAutoOptional<ObjectT>
{
  public readonly clone = (): ObjectSchema_noAutoOptional<ObjectT> => copyMetaFields({ from: this, to: object_noAutoOptional(this.map) });
}
