import type { SchemaType } from './schema-type';

/** Optional schema meta commonly available on all schemas  */
export interface CommonSchemaMeta {
  /** A description, which can be used by code generation tools to generate documentation */
  description?: string;

  /** An example, which can be used by code generation tools to generate documentation */
  example?: string;
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

  /** If `true`, this schema or any sub-elements have a custom serializer-deserializer */
  usesCustomSerDes: boolean;
}
