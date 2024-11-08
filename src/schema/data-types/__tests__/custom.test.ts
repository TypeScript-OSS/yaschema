import BigNumber from 'bignumber.js';

import { bigNumberSchema } from '../../__test_dependency__/big-number-schema.js';
import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing.js';

describe('custom schema', () => {
  it('schemaType should be "custom"', () => {
    expect(bigNumberSchema.schemaType).toBe('custom');
  });

  setupBasicTypeOperationsShouldWorkTests({
    schema: bigNumberSchema,
    deserializedValues: [new BigNumber('3.14')],
    serializedValues: [{ bignumber: '3.14' }]
  });
  setupBasicTypeOperationsShouldNotWorkTests({
    schema: bigNumberSchema,
    deserializedValues: [null, undefined, 3, 'hello', [true], { one: 1 }, new BigNumber(0).dividedBy(0)]
  });

  describe('if allowNull is used', () => {
    setupBasicTypeOperationsShouldWorkTests({ schema: bigNumberSchema.allowNull(), deserializedValues: [null] });
    setupBasicTypeOperationsShouldNotWorkTests({ schema: bigNumberSchema.allowNull(), deserializedValues: [undefined] });
  });
  describe('if optional is used', () => {
    setupBasicTypeOperationsShouldWorkTests({ schema: bigNumberSchema.optional(), deserializedValues: [undefined] });
    setupBasicTypeOperationsShouldNotWorkTests({ schema: bigNumberSchema.optional(), deserializedValues: [null] });
  });
  describe('if both allowNull and optional are used', () => {
    setupBasicTypeOperationsShouldWorkTests({ schema: bigNumberSchema.allowNull().optional(), deserializedValues: [null, undefined] });
  });
});
