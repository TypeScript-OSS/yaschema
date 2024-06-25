import { schema } from '../../../exports.js';
import {
  setupBasicTypeDeserializationShouldWorkTests,
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests,
  setupBasicTypeSerializationShouldWorkTests,
  setupBasicTypeValidationShouldWorkTests
} from '../../__test_dependency__/schema-value-testing.js';

describe('omitted object schema', () => {
  const omittedSchema = schema.omit(
    schema.object({
      one: schema.string('one', 'ONE'),
      two: schema.number().optional()
    }),
    ['two']
  );

  setupBasicTypeOperationsShouldWorkTests({
    schema: omittedSchema,
    deserializedValues: [{ one: 'one' }, { one: 'ONE' }, { one: 'ONE' }]
  });
  setupBasicTypeOperationsShouldNotWorkTests({
    schema: omittedSchema,
    deserializedValues: [null, undefined, '', [true], { one: 1 }, true, false]
  });

  setupBasicTypeSerializationShouldWorkTests({
    schema: omittedSchema,
    deserializedValues: [{ one: 'ONE', two: "anything really since this isn't in the schema" }],
    serializedValues: [{ one: 'ONE' }]
  });
  setupBasicTypeDeserializationShouldWorkTests({
    schema: omittedSchema,
    serializedValues: [{ one: 'ONE', two: "anything really since this isn't in the schema" }],
    deserializedValues: [{ one: 'ONE' }]
  });
  setupBasicTypeValidationShouldWorkTests({
    schema: omittedSchema,
    deserializedValues: [{ one: 'ONE', two: "anything really since this isn't in the schema" }]
  });
});
