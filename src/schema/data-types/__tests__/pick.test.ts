import { schema } from '../../..';
import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing';

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
    deserializedValues: [{ one: 'one' }, { one: 'ONE' }, { one: 'ONE', two: "anything really since this isn't in the schema" }]
  });
  setupBasicTypeOperationsShouldNotWorkTests({
    schema: pickedSchema,
    deserializedValues: [null, undefined, '', [true], { one: 1 }, true, false]
  });
});
