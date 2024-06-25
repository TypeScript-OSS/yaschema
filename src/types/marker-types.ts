import { makeStringSubtypeArray } from '../type-utils/make-string-subtype-array.js';

/** The built-in schema types that represent type modifiers or markers.  This is useful for code generation tools. */
export const markerTypes = makeStringSubtypeArray(
  'allOf',
  'allowEmptyString',
  'allowNull',
  'deprecated',
  'not',
  'oneOf',
  'optional',
  'root',
  'upgraded'
);
export type MarkerType = (typeof markerTypes)[0];
