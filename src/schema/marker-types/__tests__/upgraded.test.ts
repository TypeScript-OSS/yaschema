import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing';
import * as schema from '../../exports';

describe('upgraded schema', () => {
  const upgradedSchema = schema.upgraded(
    'upgraded example',
    {
      old: schema.object({
        one: schema.string(),
        two: schema.number()
      }),
      new: schema.object({ one: schema.number() })
    },
    { deadline: 'January 1, 2030' }
  );

  setupBasicTypeOperationsShouldWorkTests({
    schema: upgradedSchema,
    deserializedValues: [{ one: 'one', two: 2 }, { one: 'ONE', two: 3.14 }, { one: 3 }]
  });
  setupBasicTypeOperationsShouldNotWorkTests({ schema: upgradedSchema, deserializedValues: [null, '', [true], true, false] });
});
