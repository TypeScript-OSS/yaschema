import { schema } from '../../../exports.js';
import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing.js';

describe('object schema', () => {
  it('schemaType should be "object"', () => {
    const objectSchema = schema.object_noAutoOptional({
      one: schema.string('one', 'ONE'),
      two: schema.number().optional()
    });

    expect(objectSchema.schemaType).toBe('object');
  });

  describe('with basic sub-elements', () => {
    const objectSchema = schema.object_noAutoOptional({
      one: schema.string('one', 'ONE'),
      two: schema.number().optional()
    });

    setupBasicTypeOperationsShouldWorkTests({
      schema: objectSchema,
      deserializedValues: [{ one: 'one' }, { one: 'one', two: 2 }, { one: 'ONE', two: 3.14 }]
    });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: objectSchema,
      deserializedValues: [null, undefined, '', [true], { one: 1 }, true, false]
    });

    describe('if allowNull is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: objectSchema.allowNull(), deserializedValues: [null] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: objectSchema.allowNull(), deserializedValues: [undefined] });
    });
    describe('if optional is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: objectSchema.optional(), deserializedValues: [undefined] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: objectSchema.optional(), deserializedValues: [null] });
    });
    describe('if both allowNull and optional are used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: objectSchema.allowNull().optional(), deserializedValues: [null, undefined] });
    });
  });

  describe('with custom-serialized sub-elements', () => {
    const objectSchema = schema.object_noAutoOptional({
      one: schema.string('one', 'ONE'),
      two: schema.number().optional(),
      three: schema.date()
    });

    setupBasicTypeOperationsShouldWorkTests({
      schema: objectSchema,
      deserializedValues: [{ one: 'ONE', two: 3.14, three: new Date('2022-01-01T00:00:00.000Z') }],
      serializedValues: [{ one: 'ONE', two: 3.14, three: '2022-01-01T00:00:00.000Z' }]
    });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: objectSchema,
      deserializedValues: [
        null,
        undefined,
        '',
        [true],
        { one: 1 },
        true,
        false,
        { one: 'one', two: 2 },
        { one: 'one', two: 2, three: 'hello' }
      ]
    });
  });

  describe('with nested custom-serialized sub-elements', () => {
    const objectSchema = schema.object_noAutoOptional({
      one: schema.string('one', 'ONE'),
      two: schema.number().optional(),
      three: schema.date(),
      four: schema.object_noAutoOptional({
        one: schema.string('one', 'ONE'),
        two: schema.number().optional(),
        three: schema.date()
      })
    });

    setupBasicTypeOperationsShouldWorkTests({
      schema: objectSchema,
      deserializedValues: [
        {
          one: 'ONE',
          two: 3.14,
          three: new Date('2022-01-01T00:00:00.000Z'),
          four: { one: 'ONE', two: 3.14, three: new Date('2021-01-01T00:00:00.000Z') }
        }
      ],
      serializedValues: [
        {
          one: 'ONE',
          two: 3.14,
          three: '2022-01-01T00:00:00.000Z',
          four: { one: 'ONE', two: 3.14, three: '2021-01-01T00:00:00.000Z' }
        }
      ]
    });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: objectSchema,
      deserializedValues: [{ one: 'ONE', two: 3.14, three: new Date('2022-01-01T00:00:00.000Z') }]
    });
  });
});
