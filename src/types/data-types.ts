import { makeStringSubtypeArray } from '../type-utils/make-string-subtype-array';

/** The built-in schema types that represent data types.  This is useful for code generation tools. */
export const dataTypes = makeStringSubtypeArray(
  'any',
  'array',
  'boolean',
  'custom',
  'date',
  'number',
  'object',
  'record',
  'regex',
  'restrictedNumber',
  'string',
  'tuple'
);
export type DataType = typeof dataTypes[0];
