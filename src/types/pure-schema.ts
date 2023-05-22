import type { SchemaPreferredValidationMode, SchemaPreferredValidationModeDepth } from './schema-preferred-validation';
import type { SchemaType } from './schema-type';

/** Optional schema meta commonly available on all schemas  */
export interface CommonSchemaMeta {
  /** A description, which can be used by code generation tools to generate documentation */
  description?: string;

  /** An example, which can be used by code generation tools to generate documentation */
  example?: string;

  /**
   * If `true`, extra keys don't cause errors and won't be removed, even if `failOnUnknownKeys` and/or `removeUnknownKeys` is `true` for the
   * operation.  This effects the directly described value but not sub-values.
   */
  allowUnknownKeys: boolean;

  /**
   * The preferred validation mode for this schema.
   *
   * The lesser level of the preferred validation mode, which will be applied recursively depending on the `depth` parameter / unless
   * further re-specified, and the specified validation mode, will be used, where the order is `none < soft < hard`.
   *
   * Special Values:
   * - `"initial"` - use the initially specified validation mode for the current operation (ex. the `validation` field of the `options`
   * parameter to `deserialize`).
   * - `"inherit"` - use the closet applicable mode from an ancestor schema level.
   */
  preferredValidationMode: SchemaPreferredValidationMode;

  /**
   * The depth to apply schema-level validation preferences over.
   *
   * - `"shallow"` - The mode change only affects the validation of the value directly described by this schema.  For container types, this
   * includes the first level of fields but not deeper.
   * - `"deep"` - The mode change affects all values directly and indirectly described by this schema, unless the validation mode is
   * re-specified at a deeper level.
   */
  preferredValidationModeDepth: SchemaPreferredValidationModeDepth;
}

/** A schema without any of the automatically added functions */
export interface PureSchema<ValueT> extends CommonSchemaMeta {
  /** The type of schema */
  schemaType: SchemaType;

  /** The actual value of this field is always `undefined`, but this should be used for determining the value type represented by this
   * schema, ex. `typeof someSchema.valueType` */
  valueType: ValueT;

  /** An estimate of the time complexity for validating this element, which should be on the same order of the number of items to be
   * validated */
  estimatedValidationTimeComplexity: number;

  /** If `true`, this schema or any sub-elements have the potential to represent an object value that might need unknown-key removal */
  isOrContainsObjectPotentiallyNeedingUnknownKeyRemoval: boolean;

  /** If `true`, this schema or any sub-elements have a custom serializer-deserializer */
  usesCustomSerDes: boolean;

  /** If `true`, `"shallow"` ancestor validation mode preferences won't be used when this schemas validation mode preference is
   * `"inherit"`, like other built-in container types */
  isContainerType: boolean;
}
