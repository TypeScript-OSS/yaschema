import type { PickAlwaysDefinedValues } from './PickAlwaysDefinedValues';
import type { PickPossiblyUndefinedValues } from './PickPossiblyUndefinedValues';

// Don't export this type out of the package because type inference gets messed up

/** Converts types like `{ x: string, y: string | undefined }` to types like `{ x: string, y?: string }` */
export type TreatUndefinedAsOptional<ObjectT extends Record<string, any>> = PickAlwaysDefinedValues<ObjectT> &
  Partial<PickPossiblyUndefinedValues<ObjectT>>;
