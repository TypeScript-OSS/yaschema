import { getAsyncTimeComplexityThreshold } from '../../config/async-time-complexity-threshold';
import { getMeaningfulTypeof } from '../../type-utils/get-meaningful-typeof';
import type { CommonSchemaOptions } from '../../types/common-schema-options';
import type { Schema } from '../../types/schema';
import { noError } from '../internal/consts';
import { makeInternalSchema } from '../internal/internal-schema-maker';
import type { InternalSchemaFunctions } from '../internal/types/internal-schema-functions';
import type { InternalAsyncValidator, InternalValidationResult, InternalValidator } from '../internal/types/internal-validation';
import { appendPathComponent, atPath } from '../internal/utils/path-utils';
import { optional } from '../marker-types/optional';

/** Infers a record where the values of the original type are inferred to be the values of `Schemas` */
export type InferRecordOfSchemasFromRecordOfValues<ObjectT extends Record<string, any>> = {
  [KeyT in keyof ObjectT]: Schema<ObjectT[KeyT]>;
};

/** Picks the fields of an object type that are never undefined */
export type PickAlwaysDefinedValues<Base> = Pick<
  Base,
  {
    [Key in keyof Base]: Base[Key] extends Exclude<Base[Key], undefined> ? Key : never;
  }[keyof Base]
>;

/** Picks the fields of an object type that might be undefined */
export type PickPossiblyUndefinedValues<Base> = Omit<Base, keyof PickAlwaysDefinedValues<Base>>;

/** Converts types like `{ x: string, y: string | undefined }` to types like `{ x: string, y?: string }` */
export type TreatUndefinedAsOptional<ObjectT extends Record<string, any>> = PickAlwaysDefinedValues<ObjectT> &
  Partial<PickPossiblyUndefinedValues<ObjectT>>;

/** Requires an object, where each key has it's own schema. */
export interface ObjectSchema<ObjectT extends Record<string, any>> extends Schema<TreatUndefinedAsOptional<ObjectT>> {
  schemaType: 'object';
  map: InferRecordOfSchemasFromRecordOfValues<ObjectT>;

  partial: () => Schema<Partial<ObjectT>>;
}

/** Requires an object.  Separate schemas a specified per key. */
export const object = <ObjectT extends Record<string, any>>(
  map: InferRecordOfSchemasFromRecordOfValues<ObjectT>,
  options: CommonSchemaOptions = {}
): ObjectSchema<ObjectT> => {
  const estimatedValidationTimeComplexity = (Object.values(map) as Schema[]).reduce((out, schema) => {
    out += schema.estimatedValidationTimeComplexity;

    return out;
  }, 0);

  const needsDeepSerDes = (Object.values(map) as Schema[]).findIndex((schema) => schema.usesCustomSerDes) >= 0;

  const internalValidate: InternalValidator = (value, validatorOptions, path) => {
    const shouldStopOnFirstError = validatorOptions.validation === 'hard' || !needsDeepSerDes;

    if (value === null || Array.isArray(value) || typeof value !== 'object') {
      return { error: () => `Expected object, found ${getMeaningfulTypeof(value)}${atPath(path)}` };
    }

    if (!needsDeepSerDes && validatorOptions.validation === 'none') {
      return noError;
    }

    let errorResult: InternalValidationResult | undefined;

    for (const key of Object.keys(map)) {
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
    const keys = Object.keys(map);
    const numKeys = keys.length;

    let chunkStartIndex = 0;
    const processChunk = async () => {
      if (validatorOptions.shouldYield()) {
        await validatorOptions.yield();
      }

      let estimatedValidationTimeComplexityForKeys = 0;
      const chunkKeys: string[] = [];
      let index = chunkStartIndex;
      while (chunkKeys.length === 0 || (estimatedValidationTimeComplexityForKeys <= asyncTimeComplexityThreshold && index < numKeys)) {
        const key = keys[index];
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

  const fullObjectSchema: ObjectSchema<ObjectT> = {
    ...makeInternalSchema(
      {
        valueType: undefined as any as TreatUndefinedAsOptional<ObjectT>,
        schemaType: 'object',
        ...options,
        estimatedValidationTimeComplexity,
        usesCustomSerDes: needsDeepSerDes
      },
      { internalValidate, internalValidateAsync }
    ),
    map,
    partial: () => partial(fullObjectSchema)
  };

  return fullObjectSchema;
};

export interface PartialSchema<ObjectT extends Record<string, any>> extends Schema<Partial<ObjectT>> {
  schemaType: 'partial';
  schema: ObjectSchema<ObjectT>;
}

export const partial = <ObjectT extends Record<string, any>>(
  schema: ObjectSchema<ObjectT>,
  options: CommonSchemaOptions = {}
): PartialSchema<ObjectT> => {
  const outputMap: Partial<InferRecordOfSchemasFromRecordOfValues<Partial<ObjectT>>> = {};
  for (const key of Object.keys(schema.map) as Array<keyof typeof schema.map>) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    outputMap[key] = optional(schema.map[key]) as any;
  }

  const partialSchema = object<Partial<ObjectT>>(outputMap as InferRecordOfSchemasFromRecordOfValues<Partial<ObjectT>>);

  return makeInternalSchema(
    {
      valueType: undefined as any as Partial<ObjectT>,
      schemaType: 'partial',
      schema,
      ...options,
      estimatedValidationTimeComplexity: partialSchema.estimatedValidationTimeComplexity,
      usesCustomSerDes: partialSchema.usesCustomSerDes
    },
    {
      internalValidate: (partialSchema as any as InternalSchemaFunctions).internalValidate,
      internalValidateAsync: (partialSchema as any as InternalSchemaFunctions).internalValidateAsync
    }
  );
};
