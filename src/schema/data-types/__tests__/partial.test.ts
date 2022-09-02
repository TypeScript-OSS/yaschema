import { schema } from '../../..';
import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing';

describe('partial object schema', () => {
  const partialSchema = schema.partial(
    schema.object({
      one: schema.string('one', 'ONE'),
      two: schema.number().optional()
    })
  );

  setupBasicTypeOperationsShouldWorkTests({
    schema: partialSchema,
    deserializedValues: [{}, { two: 2 }, { one: 'one' }, { one: 'one', two: 2 }, { one: 'ONE', two: 3.14 }]
  });
  setupBasicTypeOperationsShouldNotWorkTests({
    schema: partialSchema,
    deserializedValues: [null, undefined, '', [true], { one: 1 }, true, false]
  });
});
