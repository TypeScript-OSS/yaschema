import _ from 'lodash';

/* Custom types, like Blob, in the root of `_.cloneDeep` aren't maintained properly.  Wrapping in an array fixes this issue. */
export const safeClone = <ValueT>(value: ValueT): ValueT => _.cloneDeep([value])[0];
