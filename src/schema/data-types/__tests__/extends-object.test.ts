import { schema } from '../../../exports.js';
import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing.js';

describe('extends object schema', () => {
  const baseSchema = schema.object({
    one: schema.string('one', 'ONE')
  });
  const extensionSchema = schema.extendsObject(
    baseSchema,
    schema.object({
      two: schema.number().optional()
    })
  );

  setupBasicTypeOperationsShouldWorkTests({
    schema: extensionSchema,
    deserializedValues: [{ one: 'one' }, { one: 'ONE' }, { one: 'ONE', two: 2 }]
  });
  setupBasicTypeOperationsShouldNotWorkTests({
    schema: extensionSchema,
    deserializedValues: [null, undefined, '', [true], { one: 1 }, { two: 2 }, true, false]
  });
});
