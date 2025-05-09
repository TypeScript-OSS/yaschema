import type { Schema } from '../../../types/schema';

/** Requires at least one of the schemas be satisfied. */
export interface OneOfSchema<TypeA, TypeB> extends Schema<TypeA | TypeB> {
  schemaType: 'oneOf';
  clone: () => OneOfSchema<TypeA, TypeB>;

  schemas: [Schema<TypeA>, Schema<TypeB>];
}
