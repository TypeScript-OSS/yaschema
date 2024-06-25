import { schema } from '../../../exports.js';

describe('optional schema', () => {
  describe('directly created', () => {
    const optionalSchema = schema.optional(
      schema.object({
        one: schema.number()
      })
    );

    it('schemaType should be "optional"', () => {
      expect(optionalSchema.schemaType).toBe('optional');
    });
    it('schema.schemaType should be "object"', () => {
      expect(optionalSchema.schema.schemaType).toBe('object');
      expect((optionalSchema.schema as any as schema.ObjectSchema<any>).map?.one).toBeDefined();
    });
  });

  describe('indirectly created', () => {
    const objectSchema = schema.object({
      one: schema.number()
    });
    const optionalSchema = objectSchema.optional();

    it('schemaType should be "optional"', () => {
      expect(optionalSchema.schemaType).toBe('optional');
    });
    it('schema.schemaType should be "object"', () => {
      expect((optionalSchema as schema.OptionalSchema<any>).schema.schemaType).toBe('object');
      expect(objectSchema.map?.one).toBeDefined();
      expect(((optionalSchema as schema.OptionalSchema<any>).schema as any as schema.ObjectSchema<any>).map?.one).toBeDefined();
    });
  });
});
