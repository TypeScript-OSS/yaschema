import { schema } from '..';

describe('remove unknown keys', () => {
  describe('simple objects', () => {
    const objectSchema = schema.object({
      one: schema.string('one', 'ONE'),
      two: schema.number().optional(),
      three: schema.object({
        four: schema.number(),
        five: schema.object({ six: schema.number() })
      })
    });

    it('valid object should serialize without error', () => {
      const serialization = objectSchema.deserialize(
        { one: 'one', two: 2, three: { four: 4, five: { six: 6 } } },
        { removeUnknownKeys: true }
      );
      expect(serialization.error).toBeUndefined();
      expect(serialization.deserialized).toMatchObject({ one: 'one', two: 2, three: { four: 4, five: { six: 6 } } });
    });

    it('invalid object should fail with error', () => {
      const serialization = objectSchema.deserialize(
        { one: 'TWO', two: 2, three: { four: 4, five: { six: 6 } } },
        { removeUnknownKeys: true }
      );
      expect(serialization.error).toBeDefined();
      expect(serialization.errorLevel).toBe('error');
    });

    it('valid object with extra keys should have the extra keys removed', () => {
      const serialization = objectSchema.deserialize(
        { one: 'one', two: 2, three: { four: 4, five: { six: 6, seven: '7' } }, eight: 8 },
        { removeUnknownKeys: true }
      );
      expect(serialization.error).toBeUndefined();
      expect(JSON.stringify(serialization.deserialized)).toMatch(
        JSON.stringify({ one: 'one', two: 2, three: { four: 4, five: { six: 6 } } })
      );
    });
  });

  describe('using allOf / anyOf', () => {
    const objectSchema = schema.allOf(
      schema.object({
        one: schema.string('one', 'ONE')
      }),
      schema.object({
        two: schema.number().optional(),
        three: schema.oneOf(
          schema.object({
            four: schema.number()
          }),
          schema.object({
            five: schema.object({ six: schema.number() })
          })
        )
      })
    );

    it('valid object should serialize without error', () => {
      const serialization = objectSchema.deserialize(
        { one: 'one', two: 2, three: { four: 4, five: { six: 6 } } },
        { removeUnknownKeys: true }
      );
      expect(serialization.error).toBeUndefined();
      expect(serialization.deserialized).toMatchObject({ one: 'one', two: 2, three: { four: 4, five: { six: 6 } } });
    });

    it('invalid object should fail with error', () => {
      const serialization = objectSchema.deserialize(
        { one: 'TWO', two: 2, three: { four: 4, five: { six: 6 } } },
        { removeUnknownKeys: true }
      );
      expect(serialization.error).toBeDefined();
      expect(serialization.errorLevel).toBe('error');
    });

    it('valid object with extra keys should have the extra keys removed', () => {
      const serialization = objectSchema.deserialize(
        { one: 'one', two: 2, three: { four: 4, five: { six: 6, seven: '7' } }, eight: 8 },
        { removeUnknownKeys: true }
      );
      expect(serialization.error).toBeUndefined();
      expect(JSON.stringify(serialization.deserialized)).toMatch(
        JSON.stringify({ one: 'one', two: 2, three: { four: 4, five: { six: 6 } } })
      );
    });
  });

  describe('using allOf / anyOf and setDisableRemoveUnknownKeys(true)', () => {
    const objectSchema = schema.allOf(
      schema.object({
        one: schema.string('one', 'ONE')
      }),
      schema.object({
        two: schema.number().optional(),
        three: schema.oneOf(
          schema.object({
            four: schema.number()
          }),
          schema.object({
            five: schema.object({ six: schema.number() }).setDisableRemoveUnknownKeys(true)
          })
        )
      })
    );

    it('valid object with extra keys should have the extra keys removed, except where remove unknown keys is disabled', () => {
      const serialization = objectSchema.deserialize(
        { one: 'one', two: 2, three: { four: 4, five: { six: 6, seven: '7' } }, eight: 8 },
        { removeUnknownKeys: true }
      );
      expect(serialization.error).toBeUndefined();
      expect(JSON.stringify(serialization.deserialized)).toMatch(
        JSON.stringify({ one: 'one', two: 2, three: { four: 4, five: { six: 6, seven: '7' } } })
      );
    });
  });
});
