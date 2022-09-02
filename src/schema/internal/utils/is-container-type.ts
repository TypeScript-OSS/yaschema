import type { SchemaType } from '../../../types/schema-type';

const builtInContainerSchemaTypes = new Set<SchemaType>(['array', 'object', 'record', 'tuple']);

export const isContainerType = (
  schema: { schemaType: Exclude<SchemaType, 'custom'> } | { schemaType: 'custom'; isContainerType?: boolean }
): boolean => {
  if (schema.schemaType === 'custom') {
    return schema.isContainerType ?? false;
  } else {
    return builtInContainerSchemaTypes.has(schema.schemaType);
  }
};
