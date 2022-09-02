import { schema } from '..';

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
        .setPreferredValidationMode('soft', 'deep')
    });

    it('valid object should serialize without error', () => {
      const serialization = objectSchema.deserialize({ one: 'one', two: 2, three: { four: 4, five: { six: 6 } } });
      expect(serialization.error).toBeUndefined();
      expect(serialization.deserialized).toMatchObject({ one: 'one', two: 2, three: { four: 4, five: { six: 6 } } });
    });

    it('invalid object in non-overriden parts of schema should fail with error', () => {
      const serialization = objectSchema.deserialize({ one: 'TWO', two: 2, three: { four: 4, five: { six: 6 } } });
      expect(serialization.error).toBeDefined();
      expect(serialization.errorLevel).toBe('error');
    });

    it('invalid object in deep soft-overriden parts of schema should fail with warning', () => {
      const serialization = objectSchema.deserialize({ one: 'one', two: 2, three: { four: 4, five: { six: '6' } } });
      expect(serialization.error).toBeDefined();
      expect(serialization.errorLevel).toBe('warning');
    });

    it('invalid object in shallow soft-overriden parts of schema should fail with warning', () => {
      const serialization = objectSchema.deserialize({ one: 'one', two: 2, three: { four: '4', five: { six: 6 } } });
      expect(serialization.error).toBeDefined();
      expect(serialization.errorLevel).toBe('warning');
    });
  });

  describe('with shallow override', () => {
    const objectSchema = schema.object({
      one: schema.string('one', 'ONE'),
      two: schema.number().optional(),
      three: schema
        .object({
          four: schema.number(),
          five: schema.object({ six: schema.number() })
        })
        .setPreferredValidationMode('soft', 'shallow')
    });

    it('invalid object in deep soft-overriden parts of schema should fail with error', () => {
      const serialization = objectSchema.deserialize({ one: 'one', two: 2, three: { four: 4, five: { six: '6' } } });
      expect(serialization.error).toBeDefined();
      expect(serialization.errorLevel).toBe('error');
    });

    it('invalid object in shallow soft-overriden parts of schema should fail with warning', () => {
      const serialization = objectSchema.deserialize({ one: 'one', two: 2, three: { four: '4', five: { six: 6 } } });
      expect(serialization.error).toBeDefined();
      expect(serialization.errorLevel).toBe('warning');
    });
  });
});
