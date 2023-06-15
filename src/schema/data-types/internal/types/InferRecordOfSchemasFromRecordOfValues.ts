import type { Schema } from '../../../../types/schema';

// Don't export this type out of the package because type inference gets messed up

/** Infers a record where the values of the original type are inferred to be the values of `Schemas` */
export type InferRecordOfSchemasFromRecordOfValues<ObjectT extends Record<string, any>> = {
  [KeyT in keyof ObjectT]: Schema<ObjectT[KeyT]>;
};
