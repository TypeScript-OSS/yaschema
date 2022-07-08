import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing';
import * as schema from '../../exports';

describe('root schema', () => {
  const rootSchema = schema.root(
    'root example',
    schema.object({
      one: schema.string(),
      two: schema.number()
    })
  );

  setupBasicTypeOperationsShouldWorkTests({
    schema: rootSchema,
    deserializedValues: [
      { one: 'one', two: 2 },
      { one: 'ONE', two: 3.14 }
    ]
  });
  setupBasicTypeOperationsShouldNotWorkTests({
    schema: rootSchema,
    deserializedValues: [null, '', [true], true, { one: 'one' }, { one: 1 }, false]
  });
});
