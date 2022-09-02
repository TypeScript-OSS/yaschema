import type { Schema } from '../../../types/schema';

/** Copies the common meta fields (`description`, `example`, `preferredValidationMode`, `preferredValidationModeDepth`, and
 * `disableRemoveUnknownKeys`) from the specified schema to the specified schema and returns the destination schema. */
export const copyMetaFields = <ToSchemaT extends Schema>({ from: fromSchema, to: toSchema }: { from: Schema; to: ToSchemaT }): ToSchemaT =>
  toSchema
    .setDescription(fromSchema.description)
    .setExample(fromSchema.example)
    .setDisableRemoveUnknownKeys(fromSchema.disableRemoveUnknownKeys)
    .setPreferredValidationMode(fromSchema.preferredValidationMode, fromSchema.preferredValidationModeDepth);
