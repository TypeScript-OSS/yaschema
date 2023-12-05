import type { Range } from '../../../types/range';
import type { Schema } from '../../../types/schema';

/** Requires a `Date`, which will be serialized as an ISO Date/Time string */
export interface DateSchema extends Schema<Date> {
  schemaType: 'date';
  clone: () => DateSchema;

  /** If one or more values are specified, the value must be equal to one of the specified values or in one of the specified ranges */
  allowedRanges?: Array<Range<Date>>;
}
