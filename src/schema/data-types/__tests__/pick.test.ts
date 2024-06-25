import { expectMatchingObjects } from '../../../__test_dependency__/expect-matching-objects.js';
import { schema } from '../../../exports.js';
import {
  setupBasicTypeDeserializationShouldWorkTests,
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests,
  setupBasicTypeSerializationShouldWorkTests,
  setupBasicTypeValidationShouldWorkTests
} from '../../__test_dependency__/schema-value-testing.js';

describe('picked object schema', () => {
  const pickedSchema = schema.pick(
    schema.object({
      one: schema.string('one', 'ONE'),
      two: schema.number().optional()
    }),
    ['one']
  );

  setupBasicTypeOperationsShouldWorkTests({
    schema: pickedSchema,
    deserializedValues: [{ one: 'one' }, { one: 'ONE' }]
  });
  setupBasicTypeOperationsShouldNotWorkTests({
    schema: pickedSchema,
    deserializedValues: [null, undefined, '', [true], { one: 1 }, true, false]
  });

  describe('deserialize', () => {
    it("extra keys shouldn't be included", () => {
      const deserialized = pickedSchema.deserialize({ one: 'ONE', two: "anything really since this isn't in the schema" });
      expect(deserialized.error).toBeUndefined();
      expectMatchingObjects(deserialized.deserialized, { one: 'ONE' });
    });
  });
  describe('deserializeAsync', () => {
    it("extra keys shouldn't be included", async () => {
      const deserialized = await pickedSchema.deserializeAsync({ one: 'ONE', two: "anything really since this isn't in the schema" });
      expect(deserialized.error).toBeUndefined();
      expectMatchingObjects(deserialized.deserialized, { one: 'ONE' });
    });
  });

  setupBasicTypeSerializationShouldWorkTests({
    schema: pickedSchema,
    deserializedValues: [{ one: 'ONE', two: "anything really since this isn't in the schema" }],
    serializedValues: [{ one: 'ONE' }]
  });
  setupBasicTypeDeserializationShouldWorkTests({
    schema: pickedSchema,
    serializedValues: [{ one: 'ONE', two: "anything really since this isn't in the schema" }],
    deserializedValues: [{ one: 'ONE' }]
  });
  setupBasicTypeValidationShouldWorkTests({
    schema: pickedSchema,
    deserializedValues: [{ one: 'ONE', two: "anything really since this isn't in the schema" }]
  });
});
