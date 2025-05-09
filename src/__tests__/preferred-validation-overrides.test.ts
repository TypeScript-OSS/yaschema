import { schema } from '../exports.js';

describe('preferred validation overrides', () => {
  describe('with deep override', () => {
    const objectSchema = schema.object({
      one: schema.string('one', 'ONE'),
      two: schema.number().optional(),
      three: schema
        .object({
          four: schema.number(),
          five: schema.object({ six: schema.number() })
        })
        .setPreferredValidationMode('soft')
    });

    it('valid object should serialize without error', async () => {
      const deserialization = await objectSchema.deserializeAsync({ one: 'one', two: 2, three: { four: 4, five: { six: 6 } } });
      expect(deserialization.error).toBeUndefined();
      expect(deserialization.deserialized).toMatchObject({ one: 'one', two: 2, three: { four: 4, five: { six: 6 } } });
    });

    it('invalid object in non-overriden parts of schema should fail with error', async () => {
      const deserialization = await objectSchema.deserializeAsync({ one: 'TWO', two: 2, three: { four: 4, five: { six: 6 } } });
      expect(deserialization.error).toBeDefined();
      expect(deserialization.errorLevel).toBe('error');
    });

    it('invalid object in deep soft-overriden parts of schema should fail with warning', async () => {
      const deserialization = await objectSchema.deserializeAsync({ one: 'one', two: 2, three: { four: 4, five: { six: '6' } } });
      expect(deserialization.error).toBeDefined();
      expect(deserialization.errorLevel).toBe('warning');
    });

    it('invalid object in shallow soft-overriden parts of schema should fail with warning', async () => {
      const deserialization = await objectSchema.deserializeAsync({ one: 'one', two: 2, three: { four: '4', five: { six: 6 } } });
      expect(deserialization.error).toBeDefined();
      expect(deserialization.errorLevel).toBe('warning');
    });
  });
});
