import type { Schema } from '../../../types/schema';

/** Requires either and old schema or a new schema be satisfied. */

export interface UpgradedSchema<OldT, NewT> extends Schema<OldT | NewT> {
  schemaType: 'upgraded';
  clone: () => UpgradedSchema<OldT, NewT>;

  oldSchema: Schema<OldT>;
  newSchema: Schema<NewT>;
  deadline?: string;
  uniqueName: string;
}
