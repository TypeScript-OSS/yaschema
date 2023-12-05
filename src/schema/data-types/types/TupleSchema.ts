import type { Schema } from '../../../types/schema';

/** Requires a value where items must positionally match the specified schemas */
export interface TupleSchema<TypeA = void, TypeB = void, TypeC = void, TypeD = void, TypeE = void>
  extends Schema<
    TypeA extends void
      ? []
      : TypeB extends void
        ? [TypeA]
        : TypeC extends void
          ? [TypeA, TypeB]
          : TypeD extends void
            ? [TypeA, TypeB, TypeC]
            : TypeE extends void
              ? [TypeA, TypeB, TypeC, TypeD]
              : [TypeA, TypeB, TypeC, TypeD, TypeE]
  > {
  schemaType: 'tuple';
  clone: () => TupleSchema<TypeA, TypeB, TypeC, TypeD, TypeE>;

  items:
    | []
    | [Schema<TypeA>]
    | [Schema<TypeA>, Schema<TypeB>]
    | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>]
    | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>]
    | [Schema<TypeA>, Schema<TypeB>, Schema<TypeC>, Schema<TypeD>, Schema<TypeE>];
}
