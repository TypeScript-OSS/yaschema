import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing';
import * as schema from '../../exports';

describe('deprecated schema', () => {
  const deprecatedSchema = schema.deprecated(
    'deprecated example',
    schema.object({
      one: schema.string(),
      two: schema.number()
    }),
    { deadline: 'January 1, 2030' }
  );

  setupBasicTypeOperationsShouldWorkTests({
    schema: deprecatedSchema,
    deserializedValues: [
      { one: 'one', two: 2 },
      { one: 'ONE', two: 3.14 }
    ]
  });
  setupBasicTypeOperationsShouldNotWorkTests({ schema: deprecatedSchema, deserializedValues: [null, '', [true], { one: 1 }, true, false] });
});
