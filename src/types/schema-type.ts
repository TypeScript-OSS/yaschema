import { makeStringSubtypeArray } from '../type-utils/make-string-subtype-array.js';
import { dataTypes } from './data-types.js';
import { markerTypes } from './marker-types.js';

export const schemaTypes = makeStringSubtypeArray(markerTypes, dataTypes);
export type SchemaType = (typeof schemaTypes)[0];
