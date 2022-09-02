import { schema } from '../../..';
import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing';

describe('oneOf schema', () => {
  const oneOfSchema = schema.oneOf(
    schema.object({
      one: schema.string('one', 'ONE'),
      two: schema.number().optional()
    }),
    schema.object({ three: schema.boolean() })
  );

  it('schemaType should be "oneOf"', () => {
    expect(oneOfSchema.schemaType).toBe('oneOf');
  });

  setupBasicTypeOperationsShouldWorkTests({
    schema: oneOfSchema,
    deserializedValues: [{ one: 'one' }, { one: 'one', two: 2 }, { three: false }]
  });
  setupBasicTypeOperationsShouldNotWorkTests({
    schema: oneOfSchema,
    deserializedValues: [null, undefined, '', [true], { one: 1 }, true, false, {}]
  });

  describe('if allowNull is used', () => {
    setupBasicTypeOperationsShouldWorkTests({ schema: oneOfSchema.allowNull(), deserializedValues: [null] });
    setupBasicTypeOperationsShouldNotWorkTests({ schema: oneOfSchema.allowNull(), deserializedValues: [undefined] });
  });
  describe('if optional is used', () => {
    setupBasicTypeOperationsShouldWorkTests({ schema: oneOfSchema.optional(), deserializedValues: [undefined] });
    setupBasicTypeOperationsShouldNotWorkTests({ schema: oneOfSchema.optional(), deserializedValues: [null] });
  });
  describe('if both allowNull and optional are used', () => {
    setupBasicTypeOperationsShouldWorkTests({ schema: oneOfSchema.allowNull().optional(), deserializedValues: [null, undefined] });
  });
});
