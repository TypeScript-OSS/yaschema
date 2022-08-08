import type { TransformationOptions } from './transformation-options';
import type { ValidationOptions } from './validation-options';

/** If error is undefined, the result is a success.  Otherwise, there was a problem. */
export type DeserializationResult<T> = { error?: undefined; deserialized: T } | { error: string; deserialized?: T };

/** Synchronously deserializes the specified value from JSON */
export type Deserializer<T> = (value: any, options?: TransformationOptions & ValidationOptions) => DeserializationResult<T>;

/** Asynchronously deserializes the specified value from JSON */
export type AsyncDeserializer<T> = (value: any, options?: TransformationOptions & ValidationOptions) => Promise<DeserializationResult<T>>;
