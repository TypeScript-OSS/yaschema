import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing';
import * as schema from '../../exports';

describe('allOf schema', () => {
  it('schemaType should be "allOf"', () => {
    const allOfSchema = schema.allOf(
      schema.object({
        one: schema.string('one', 'ONE'),
        two: schema.number().optional()
      }),
      schema.object({ three: schema.boolean() })
    );

    expect(allOfSchema.schemaType).toBe('allOf');
  });

  describe('with basic sub-elements', () => {
    const allOfSchema = schema.allOf(
      schema.object({
        one: schema.string('one', 'ONE'),
        two: schema.number().optional()
      }),
      schema.object({ three: schema.boolean() })
    );

    setupBasicTypeOperationsShouldWorkTests({
      schema: allOfSchema,
      deserializedValues: [
        { one: 'one', two: 2, three: true },
        { one: 'ONE', two: 3.14, three: false }
      ]
    });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: allOfSchema,
      deserializedValues: [null, undefined, '', [true], { one: 1 }, true, false, { one: 'one', two: 2 }]
    });

    describe('if allowNull is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: allOfSchema.allowNull(), deserializedValues: [null] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: allOfSchema.allowNull(), deserializedValues: [undefined] });
    });
    describe('if optional is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: allOfSchema.optional(), deserializedValues: [undefined] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: allOfSchema.optional(), deserializedValues: [null] });
    });
    describe('if both allowNull and optional are used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: allOfSchema.allowNull().optional(), deserializedValues: [null, undefined] });
    });
  });

  describe('with custom-serialized sub-elements', () => {
    const allOfSchema = schema.allOf(
      schema.object({
        one: schema.string('one', 'ONE'),
        two: schema.number().optional()
      }),
      schema.object({ three: schema.date() })
    );

    setupBasicTypeOperationsShouldWorkTests({
      schema: allOfSchema,
      deserializedValues: [{ one: 'ONE', two: 3.14, three: new Date('2022-01-01T00:00:00.000Z') }],
      serializedValues: [{ one: 'ONE', two: 3.14, three: '2022-01-01T00:00:00.000Z' }]
    });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: allOfSchema,
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
});
