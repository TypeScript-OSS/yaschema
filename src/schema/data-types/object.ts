import { getAsyncTimeComplexityThreshold } from '../../config/async-time-complexity-threshold';
import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type { InternalAsyncValidator, InternalValidationResult, InternalValidator } from '../internal/types/internal-validation';
import { copyMetaFields } from '../internal/utils/copy-meta-fields';
import { appendPathComponent, atPath } from '../internal/utils/path-utils';
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
export const object = <ObjectT extends Record<string, any>>(
  map: InferRecordOfSchemasFromRecordOfValues<ObjectT>
): ObjectSchema<ObjectT> => {
  const mapKeys = Object.keys(map);
  const mapValues = Object.values(map) as Schema[];

  const estimatedValidationTimeComplexity = mapValues.reduce((out, schema) => {
    out += schema.estimatedValidationTimeComplexity;

    return out;
  }, 0);

  const needsDeepSerDes = mapValues.findIndex((schema) => schema.usesCustomSerDes) >= 0;

  const internalValidate: InternalValidator = (value, validatorOptions, path) => {
    const shouldStopOnFirstError = validatorOptions.validation === 'hard' || !needsDeepSerDes;

    if (value === null || Array.isArray(value) || typeof value !== 'object') {
      return { error: () => `Expected object, found ${getMeaningfulTypeof(value)}${atPath(path)}` };
    }

    if (!needsDeepSerDes && validatorOptions.validation === 'none') {
      return noError;
    }

    let errorResult: InternalValidationResult | undefined;

    for (const key of mapKeys) {
      let valueForKey = undefined;
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        valueForKey = value[key];
      } catch (e) {
        // Ignoring just in case
      }

      const result = (map[key] as any as InternalSchemaFunctions).internalValidate(
        valueForKey,
        validatorOptions,
        appendPathComponent(path, key)
      );
      if (errorResult === undefined && result.error !== undefined) {
        errorResult = result;

        if (shouldStopOnFirstError) {
          return errorResult;
        }
      }
    }

    return errorResult ?? noError;
  };
  const internalValidateAsync: InternalAsyncValidator = async (value, validatorOptions, path) => {
    const shouldStopOnFirstError = validatorOptions.validation === 'hard' || !needsDeepSerDes;

    if (value === null || Array.isArray(value) || typeof value !== 'object') {
      return { error: () => `Expected object, found ${getMeaningfulTypeof(value)}${atPath(path)}` };
    }

    if (!needsDeepSerDes && validatorOptions.validation === 'none') {
      return noError;
    }

    let errorResult: InternalValidationResult | undefined;

    const asyncTimeComplexityThreshold = getAsyncTimeComplexityThreshold();
    const numKeys = mapKeys.length;

    let chunkStartIndex = 0;
    const processChunk = async () => {
      if (validatorOptions.shouldYield()) {
        await validatorOptions.yield();
      }

      let estimatedValidationTimeComplexityForKeys = 0;
      const chunkKeys: string[] = [];
      let index = chunkStartIndex;
      while (chunkKeys.length === 0 || (estimatedValidationTimeComplexityForKeys <= asyncTimeComplexityThreshold && index < numKeys)) {
        const key = mapKeys[index];
        estimatedValidationTimeComplexityForKeys += map[key].estimatedValidationTimeComplexity;
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

        const result =
          map[key].estimatedValidationTimeComplexity > asyncTimeComplexityThreshold
            ? await (map[key] as any as InternalSchemaFunctions).internalValidateAsync(
                valueForKey,
                validatorOptions,
                appendPathComponent(path, key)
              )
            : (map[key] as any as InternalSchemaFunctions).internalValidate(valueForKey, validatorOptions, appendPathComponent(path, key));
        if (errorResult === undefined && result.error !== undefined) {
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

  const fullSchema: ObjectSchema<ObjectT> = makeInternalSchema(
    {
      valueType: undefined as any as TreatUndefinedAsOptional<ObjectT>,
      schemaType: 'object',
      clone: () => copyMetaFields({ from: fullSchema, to: object(fullSchema.map) }),
      estimatedValidationTimeComplexity,
      usesCustomSerDes: needsDeepSerDes,
      map
    },
    { internalValidate, internalValidateAsync }
  );

  return fullSchema;
};

/** Creates a version of the specified object schema where all values are optional.  This doesn't create a distinct schema type.  */
export const partial = <ObjectT extends Record<string, any>>(schema: ObjectSchema<ObjectT>): ObjectSchema<Partial<ObjectT>> => {
  const outputMap: Partial<InferRecordOfSchemasFromRecordOfValues<Partial<ObjectT>>> = {};
  for (const key of Object.keys(schema.map) as Array<keyof typeof schema.map>) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    outputMap[key] = optional(schema.map[key]) as any;
  }

  return object<Partial<ObjectT>>(outputMap as InferRecordOfSchemasFromRecordOfValues<Partial<ObjectT>>);
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

  return object<Pick<ObjectT, KeyT>>(outputMap as InferRecordOfSchemasFromRecordOfValues<Pick<ObjectT, KeyT>>);
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

  return object<Omit<ObjectT, KeyT>>(outputMap as InferRecordOfSchemasFromRecordOfValues<Omit<ObjectT, KeyT>>);
};
