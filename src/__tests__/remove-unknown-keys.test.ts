import { schema } from '..';

// TODO: make tests for failOnUnknownKey

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
      const deserialization = objectSchema.deserialize(
        { one: 'one', two: 2, three: { four: 4, five: { six: 6 } } },
        { removeUnknownKeys: true }
      );
      expect(deserialization.error).toBeUndefined();
      expect(deserialization.deserialized).toMatchObject({ one: 'one', two: 2, three: { four: 4, five: { six: 6 } } });
    });

    it('invalid object should fail with error', () => {
      const deserialization = objectSchema.deserialize(
        { one: 'TWO', two: 2, three: { four: 4, five: { six: 6 } } },
        { removeUnknownKeys: true }
      );
      expect(deserialization.error).toBeDefined();
      expect(deserialization.errorLevel).toBe('error');
    });

    it('valid object with extra keys should have the extra keys removed', () => {
      const deserialization = objectSchema.deserialize(
        { one: 'one', two: 2, three: { four: 4, five: { six: 6, seven: '7' } }, eight: 8 },
        { removeUnknownKeys: true }
      );
      expect(deserialization.error).toBeUndefined();
      expect(JSON.stringify(deserialization.deserialized)).toMatch(
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
      const deserialization = objectSchema.deserialize(
        { one: 'one', two: 2, three: { four: 4, five: { six: 6 } } },
        { removeUnknownKeys: true }
      );
      expect(deserialization.error).toBeUndefined();
      expect(deserialization.deserialized).toMatchObject({ one: 'one', two: 2, three: { four: 4, five: { six: 6 } } });
    });

    it('invalid object should fail with error', () => {
      const deserialization = objectSchema.deserialize(
        { one: 'TWO', two: 2, three: { four: 4, five: { six: 6 } } },
        { removeUnknownKeys: true }
      );
      expect(deserialization.error).toBeDefined();
      expect(deserialization.errorLevel).toBe('error');
    });

    it('valid object with extra keys should have the extra keys removed', () => {
      const deserialization = objectSchema.deserialize(
        { one: 'one', two: 2, three: { four: 4, five: { six: 6, seven: '7' } }, eight: 8 },
        { removeUnknownKeys: true }
      );
      expect(deserialization.error).toBeUndefined();
      expect(JSON.stringify(deserialization.deserialized)).toMatch(
        JSON.stringify({ one: 'one', two: 2, three: { four: 4, five: { six: 6 } } })
      );
    });
  });

  describe('using allOf / anyOf and setAllowUnknownKeys(true)', () => {
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
            five: schema.object({ six: schema.number() }).setAllowUnknownKeys(true)
          })
        )
      })
    );

    it('valid object with extra keys should have the extra keys removed, except where remove unknown keys is disabled', () => {
      const deserialization = objectSchema.deserialize(
        { one: 'one', two: 2, three: { four: 4, five: { six: 6, seven: '7' } }, eight: 8 },
        { removeUnknownKeys: true }
      );
      expect(deserialization.error).toBeUndefined();
      expect(JSON.stringify(deserialization.deserialized)).toMatch(
        JSON.stringify({ one: 'one', two: 2, three: { four: 4, five: { six: 6, seven: '7' } } })
      );
    });
  });

  describe('records', () => {
    it('with regex keys', () => {
      const recordSchema = schema.record(/^hello.*$/, schema.number());

      const deserialization = recordSchema.deserialize({ hello: 1, helloTest: 2, goodbye: 2 }, { removeUnknownKeys: true });
      expect(deserialization.error).toBeUndefined();
      expect(JSON.stringify(deserialization.deserialized)).toMatch(JSON.stringify({ hello: 1, helloTest: 2 }));
    });

    it('with schema keys', () => {
      const recordSchema = schema.record(schema.string('hello', 'world'), schema.number());

      const deserialization = recordSchema.deserialize({ hello: 1, helloTest: 2, world: 3, goodbye: 2 }, { removeUnknownKeys: true });
      expect(deserialization.error).toBeUndefined();
      expect(JSON.stringify(deserialization.deserialized)).toMatch(JSON.stringify({ hello: 1, world: 3 }));
    });
  });
});
