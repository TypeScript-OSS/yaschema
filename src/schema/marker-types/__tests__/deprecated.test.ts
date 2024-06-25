import { schema } from '../../../exports.js';
import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing.js';

describe('deprecated schema', () => {
  const deprecatedSchema = schema.deprecated(
    'deprecated example',
    schema.object({
      one: schema.string(),
      two: schema.number()
    }),
    { deadline: 'January 1, 2030' }
  );

  it('schemaType should be "deprecated"', () => {
    expect(deprecatedSchema.schemaType).toBe('deprecated');
  });

  setupBasicTypeOperationsShouldWorkTests({
    schema: deprecatedSchema,
    deserializedValues: [
      { one: 'one', two: 2 },
      { one: 'ONE', two: 3.14 }
    ]
  });
  setupBasicTypeOperationsShouldNotWorkTests({ schema: deprecatedSchema, deserializedValues: [null, '', [true], { one: 1 }, true, false] });
});
