import { withResolved } from '../../../internal/utils/withResolved.js';
import type { AsyncDeserializer, AsyncParser, DeserializationResult } from '../../../types/deserializer.js';
import type { JsonValue } from '../../../types/json-value.js';
import type { TypeOrPromisedType } from '../../../types/TypeOrPromisedType.js';

/** Makes the public async parser interface */
export const makeExternalAsyncParser =
  <T>(deserializeAsync: AsyncDeserializer<T>): AsyncParser<T> =>
  (value, options = {}): TypeOrPromisedType<T> => {
    let jsonValue: JsonValue;
    try {
      jsonValue = JSON.parse(value) as JsonValue;
    } catch (_e) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw {
        error: 'Invalid JSON string',
        errorPath: '',
        errorLevel: 'error'
      } satisfies DeserializationResult<T>;
    }

    const deserialization = deserializeAsync(jsonValue, options);
    return withResolved(deserialization, (deserialization): T => {
      if (deserialization.error !== undefined) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw deserialization;
      }

      return deserialization.deserialized;
    });
  };
