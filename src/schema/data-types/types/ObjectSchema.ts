import type { Schema } from '../../../types/schema';

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

/** Requires an object, where each key has it's own schema. */
export interface ObjectSchema<ObjectT extends Record<string, any>> extends Schema<TreatUndefinedAsOptional<ObjectT>> {
  readonly schemaType: 'object';
  readonly clone: () => ObjectSchema<ObjectT>;

  readonly map: InferRecordOfSchemasFromRecordOfValues<ObjectT>;

  /** If `true`, extra keys won't be removed.  This effects the directly described value but not sub-values. */
  allowUnknownKeys: boolean;
  readonly setAllowUnknownKeys: (allow: boolean) => this;
}
