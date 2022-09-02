import type { ValidationMode } from './validation-options';

/**
 * The validation mode preferences for a schema.
 * - `"initial"` - use the initially specified validation mode for the current operation (ex. the `validation` field of the `options`
 * parameter to `deserialize`).
 * - `"inherit"` - use the closet applicable mode from an ancestor schema level.
 */
export type SchemaPreferredValidationMode = ValidationMode | 'initial' | 'inherit';

/**
 * The depth to apply schema-level validation preferences over.
 * - `"shallow"` - (default) The mode change only affects the validation of the value directly described by this schema.  For container
 * types, this includes the first level of fields but not deeper.
 * - `"deep"` - The mode change affects all values directly and indirectly described by this schema, unless the validation mode is
 * re-specified at a deeper level.
 */
export type SchemaPreferredValidationModeDepth = 'deep' | 'shallow';
