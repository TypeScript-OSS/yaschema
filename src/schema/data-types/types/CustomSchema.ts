import type { JsonValue } from '../../../types/json-value';
import type { Schema } from '../../../types/schema';
import type { SerDes } from '../../../types/ser-des';

/** Used for adding custom schemas for complex types. */

export interface CustomSchema<ValueT, SerializedT extends JsonValue> extends Schema<ValueT> {
  schemaType: 'custom';
  clone: () => CustomSchema<ValueT, SerializedT>;

  serDes: SerDes<ValueT, SerializedT>;
  typeName: string;
}
