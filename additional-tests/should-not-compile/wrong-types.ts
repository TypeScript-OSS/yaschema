import { Schema, schema } from '../..';

const mixedObjectsSchema = schema.allOf(schema.object({ a: schema.number() }), schema.object({ b: schema.string() }));
type MixedObjects = typeof mixedObjectsSchema.valueType;
const mo: MixedObjects = { a: '1', b: 2 };
console.log(mo);

const wrappedMixedObjectsSchema = schema.object({
  myMixedObjects: mixedObjectsSchema
});
type WrappedMixedObjects = typeof wrappedMixedObjectsSchema.valueType;
const wmo: WrappedMixedObjects = { myMixedObjects: { a: '1', b: 2 } };
console.log(wmo);

const makeSchemaWithDynamicSubschema = <T extends string>({ valueSchema }: { valueSchema: Schema<T> }) =>
  schema.object_noAutoOptional({
    wmo: wrappedMixedObjectsSchema,
    value: valueSchema.optional()
  });
type SchemaWithDynamicSubschema<T extends string> = ReturnType<typeof makeSchemaWithDynamicSubschema<T>>['valueType'];

const swds: SchemaWithDynamicSubschema<'hello' | 'world'> = { wmo: { myMixedObjects: { a: '1', b: 2 } }, value: 'goodbye' };
console.log(swds);
