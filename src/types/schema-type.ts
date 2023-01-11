import { makeStringSubtypeArray } from '../type-utils/make-string-subtype-array';
import { dataTypes } from './data-types';
import { markerTypes } from './marker-types';

export const schemaTypes = makeStringSubtypeArray(markerTypes, dataTypes);
export type SchemaType = (typeof schemaTypes)[0];
