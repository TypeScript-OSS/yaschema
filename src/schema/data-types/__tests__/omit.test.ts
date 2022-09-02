import { schema } from '../../..';
import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing';

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
    deserializedValues: [{ one: 'one' }, { one: 'ONE' }, { one: 'ONE', two: "anything really since this isn't in the schema" }]
  });
  setupBasicTypeOperationsShouldNotWorkTests({
    schema: omittedSchema,
    deserializedValues: [null, undefined, '', [true], { one: 1 }, true, false]
  });
});
