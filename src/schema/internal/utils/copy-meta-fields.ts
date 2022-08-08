import type { Schema } from '../../../types/schema';

/** Copies the common meta fields (description and example) from the specified schema to the specified schema and returns the destination
 * schema. */
export const copyMetaFields = <ToSchemaT extends Schema>({ from: fromSchema, to: toSchema }: { from: Schema; to: ToSchemaT }): ToSchemaT =>
  toSchema.setDescription(fromSchema.description).setExample(fromSchema.example);
