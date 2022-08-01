import type { DeserializationResult } from './deserializer';
import type { JsonValue } from './json-value';
import type { Schema } from './schema';
import type { SerializationResult } from './serializer';

/** A serializer-deserializer */
export interface SerDes<ValueT, SerializedT extends JsonValue> {
  /** Deserialize (and validate) a value */
  deserialize: (value: SerializedT) => DeserializationResult<ValueT>;
  /** Checks if the specified value is the expected type, which is checked before serialization is attempted */
  isValueType: (value: any) => value is ValueT;
  /** Serialize (and validate) a value */
  serialize: (value: ValueT) => SerializationResult;
  /** A schema for the serialized form, which is checked before deserialization is attempted */
  serializedSchema: () => Schema<SerializedT>;
}

/** Make a custom serializer-deserializer */
export const makeSerDes = <ValueT, SerializedT extends JsonValue>(serDes: SerDes<ValueT, SerializedT>) => serDes;
