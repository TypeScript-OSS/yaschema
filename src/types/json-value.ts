/** Any JSON-compatible array value */
export type JsonArray = JsonValue[];
/** Any JSON-compatible object value */
export type JsonObject = Partial<{ [key: string]: JsonValue }>;
/** Any JSON-compatible value */
export type JsonValue = string | number | boolean | null | JsonArray | JsonObject;
