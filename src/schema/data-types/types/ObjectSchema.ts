import type { Schema } from '../../../types/schema';
import type { InferRecordOfSchemasFromRecordOfValues } from '../internal/types/InferRecordOfSchemasFromRecordOfValues';
import type { TreatUndefinedAsOptional } from '../internal/types/TreatUndefinedAsOptional';

/** Requires an object, where each key has it's own schema. */
export interface ObjectSchema<ObjectT extends Record<string, any>> extends Schema<TreatUndefinedAsOptional<ObjectT>> {
  readonly schemaType: 'object';
  readonly clone: () => ObjectSchema<ObjectT>;

  readonly map: InferRecordOfSchemasFromRecordOfValues<ObjectT>;

  /** If `true`, extra keys won't be removed.  This effects the directly described value but not sub-values. */
  allowUnknownKeys: boolean;
  readonly setAllowUnknownKeys: (allow: boolean) => this;
}
