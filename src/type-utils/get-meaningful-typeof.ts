import { getMeaningfulTypeofExtractor } from '../config/meaningful-typeof.js';

/**
 * Determines a human-meaningful type for a given value, especially if custom schema types have been added.
 *
 * If the specified value is `null`, `undefined`, a `Date`, or a primitive (non-object) type, the type is determined directly, which will be
 * one of: `'null'`, `'undefined'`, `'Date'`, `'number'`, `'boolean'`, `'bigint'`, `'function'`, or `'symbol'`.
 *
 * If the specified value is an object type, this first calls the registered meaningful typeof extractor, if available, and returns the
 * result, if defined.  Otherwise, if the value is an array, this returns `'array'` or, if not, returns `'object'`.
 *
 * @see `setMeaningfulTypeofExtractor`
 */
export const getMeaningfulTypeof = (value: any) => {
  if (value === null) {
    return 'null';
  } else if (value === undefined) {
    return 'undefined';
  } else if (value instanceof Date) {
    return 'Date';
  } else {
    const type = typeof value;
    if (type !== 'object') {
      return type;
    }

    const extracted = getMeaningfulTypeofExtractor()?.(value);
    if (extracted !== undefined) {
      return extracted;
    } else if (Array.isArray(value)) {
      return 'array';
    } else {
      return 'object';
    }
  }
};
