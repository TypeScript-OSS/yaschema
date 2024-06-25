import { schema } from '../../../exports.js';
import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing.js';

describe('root schema', () => {
  const rootSchema = schema.root(
    'root example',
    schema.object({
      one: schema.string(),
      two: schema.number()
    })
  );

  it('schemaType should be "root"', () => {
    expect(rootSchema.schemaType).toBe('root');
  });

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
