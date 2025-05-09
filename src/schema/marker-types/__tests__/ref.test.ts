import { schema } from '../../../exports.js';
import type { Schema } from '../../../types/schema.js';
import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing.js';

describe('ref schema', () => {
  type Container = { value: number; a?: Container };
  const containerSchema = schema.object({
    value: schema.number(),
    a: schema.ref((): Schema<Container> => containerSchema).optional()
  });

  setupBasicTypeOperationsShouldWorkTests({
    schema: containerSchema,
    deserializedValues: [
      { value: 1 },
      { value: 2, a: undefined },
      { value: 3, a: { value: 4 } },
      { value: 5, a: { value: 6, a: { value: 7, a: undefined } } }
    ]
  });
  setupBasicTypeOperationsShouldNotWorkTests({
    schema: containerSchema,
    deserializedValues: [null, undefined, '', [true], { one: 1 }, true, false]
  });
});
