import type { CommonSchemaOptions } from '../../types/common-schema-options';
import type { Schema } from '../../types/schema';
import { optional } from '../marker-types/optional';
import { object, ObjectSchema } from './object';

/** Infers a record where the values of the original type are inferred to be the values of `Schemas` */
type InferRecordOfSchemasFromRecordOfValues<ObjectT extends Record<string, any>> = {
  [KeyT in keyof ObjectT]: Schema<ObjectT[KeyT]>;
};

export interface PartialSchema<ObjectT extends Record<string, any>> extends Schema<Partial<ObjectT>> {
  schemaType: 'partial';
  schema: ObjectSchema<ObjectT>;
}

export const partial = <ObjectT extends Record<string, any>>(
  schema: ObjectSchema<ObjectT>,
  options: CommonSchemaOptions = {}
): ObjectSchema<Partial<ObjectT>> => {
  const outputMap: Partial<InferRecordOfSchemasFromRecordOfValues<Partial<ObjectT>>> = {};
  for (const key of Object.keys(schema.map) as Array<keyof typeof schema.map>) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    outputMap[key] = optional(schema.map[key]) as any;
  }

  return object<Partial<ObjectT>>(outputMap as InferRecordOfSchemasFromRecordOfValues<Partial<ObjectT>>, options);
};
