import type { Schema } from '../../../types/schema';

/** Requires all of the schemas be satisfied. */

export interface AllOfSchema<TypeA, TypeB> extends Schema<TypeA & TypeB> {
  schemaType: 'allOf';
  clone: () => AllOfSchema<TypeA, TypeB>;

  schemas: [Schema<TypeA>, Schema<TypeB>];
}
