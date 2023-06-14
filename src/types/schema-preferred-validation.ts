import type { ValidationMode } from './validation-options';

/**
 * The validation mode preferences for a schema.
 * - `"initial"` - use the initially specified validation mode for the current operation (ex. the `validation` field of the `options`
 * parameter to `deserialize`).
 * - `"inherit"` - use the closet applicable mode from an ancestor schema level.
 */
export type SchemaPreferredValidationMode = ValidationMode | 'initial' | 'inherit';
