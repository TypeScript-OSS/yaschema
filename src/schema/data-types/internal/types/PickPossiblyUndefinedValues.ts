import type { PickAlwaysDefinedValues } from './PickAlwaysDefinedValues';

// Don't export this type out of the package because type inference gets messed up

/** Picks the fields of an object type that might be undefined */
export type PickPossiblyUndefinedValues<Base> = Omit<Base, keyof PickAlwaysDefinedValues<Base>>;
