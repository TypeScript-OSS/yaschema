import { schema } from '../../..';
import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing';

describe('date schema', () => {
  it('schemaType should be "date"', () => {
    const dateSchema = schema.date();

    expect(dateSchema.schemaType).toBe('date');
  });

  describe('without expected values', () => {
    const dateSchema = schema.date();

    it('of string matching schema should work with okToMutateInputValue=true', () => {
      const validation = dateSchema.deserialize('2022-01-01T00:00:00.000Z', { okToMutateInputValue: true });
      expect(validation.deserialized).toEqual(new Date('2022-01-01T00:00:00.000Z'));
      expect(validation.error).toBeUndefined();
    });

    setupBasicTypeOperationsShouldWorkTests({
      schema: dateSchema,
      deserializedValues: [new Date('2022-01-01T00:00:00.000Z')],
      serializedValues: ['2022-01-01T00:00:00.000Z']
    });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: dateSchema,
      deserializedValues: [null, undefined, 3, 'hello', [true], { one: 1 }]
    });

    describe('if allowNull is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: dateSchema.allowNull(), deserializedValues: [null] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: dateSchema.allowNull(), deserializedValues: [undefined] });
    });
    describe('if optional is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: dateSchema.optional(), deserializedValues: [undefined] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: dateSchema.optional(), deserializedValues: [null] });
    });
    describe('if both allowNull and optional are used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: dateSchema.allowNull().optional(), deserializedValues: [null, undefined] });
    });
  });

  describe('with range restrictions', () => {
    const dateSchema = schema.date(
      { min: new Date('1990-01-01'), max: new Date('1993-01-01') },
      { min: new Date('1995-01-01'), minExclusive: true, max: new Date('1995-02-01'), maxExclusive: true },
      { min: new Date('2025-01-01') },
      { max: new Date('1940-01-01') }
    );

    setupBasicTypeOperationsShouldWorkTests({
      schema: dateSchema,
      deserializedValues: [
        new Date('1920-01-01'),
        new Date('1940-01-01'),
        new Date('1990-01-01'),
        new Date('1991-01-01'),
        new Date('1993-01-01'),
        new Date('1995-01-02'),
        new Date('1995-01-31'),
        new Date('2025-01-01'),
        new Date('2025-01-02')
      ],
      serializedValues: [
        '1920-01-01T00:00:00.000Z',
        '1940-01-01T00:00:00.000Z',
        '1990-01-01T00:00:00.000Z',
        '1991-01-01T00:00:00.000Z',
        '1993-01-01T00:00:00.000Z',
        '1995-01-02T00:00:00.000Z',
        '1995-01-31T00:00:00.000Z',
        '2025-01-01T00:00:00.000Z',
        '2025-01-02T00:00:00.000Z'
      ]
    });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: dateSchema,
      deserializedValues: [
        null,
        undefined,
        'hello',
        [true],
        { one: 1 },
        true,
        false,
        NaN,
        Number.NEGATIVE_INFINITY,
        Number,
        new Date('1989-01-01'),
        new Date('1994-01-01'),
        new Date('1995-01-01'),
        new Date('1995-02-01')
      ],
      serializedValues: [
        null,
        undefined,
        'hello',
        [true],
        { one: 1 },
        true,
        false,
        NaN,
        Number.NEGATIVE_INFINITY,
        Number,
        '1989-01-01T00:00:00.000Z',
        '1994-01-01T00:00:00.000Z',
        '1995-01-01T00:00:00.000Z',
        '1995-02-01T00:00:00.000Z'
      ]
    });

    describe('if allowNull is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: dateSchema.allowNull(), deserializedValues: [null] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: dateSchema.allowNull(), deserializedValues: [undefined] });
    });
    describe('if optional is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: dateSchema.optional(), deserializedValues: [undefined] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: dateSchema.optional(), deserializedValues: [null] });
    });
    describe('if both allowNull and optional are used', () => {
      setupBasicTypeOperationsShouldWorkTests({
        schema: dateSchema.allowNull().optional(),
        deserializedValues: [null, undefined]
      });
    });
  });
});
