/** Any JSON-compatible array value */
export type JsonArray = JsonValue[];
/** Any JSON-compatible object value */
export type JsonObject = { [key: string]: JsonValue };
/** Any JSON-compatible value.  Including undefined since we serialize it by not-serializing it. */
export type JsonValue = string | number | boolean | null | JsonArray | JsonObject | undefined;
