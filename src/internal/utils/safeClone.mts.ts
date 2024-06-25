import { cloneDeep } from 'lodash-es';

/* Custom types, like Blob, in the root of `_.cloneDeep` aren't maintained properly.  Wrapping in an array fixes this issue. */
export const safeClone = <ValueT>(value: ValueT): ValueT => cloneDeep([value])[0];
