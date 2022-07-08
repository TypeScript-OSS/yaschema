import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing';
import * as schema from '../../exports';

describe('record schema', () => {
  describe('with basic sub-elements', () => {
    const recordSchema = schema.record(schema.string('hello', 'world'), schema.number());

    setupBasicTypeOperationsShouldWorkTests({
      schema: recordSchema,
      deserializedValues: [{}, { hello: 3 }, { world: 3.14 }, { hello: 3, world: 3.14 }, { hello: 3, foo: 'hello' }, { foo: 'hello' }]
    });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: recordSchema,
      deserializedValues: [null, undefined, '', [true], true, false, { hello: 'world' }]
    });

    describe('if allowNull is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: recordSchema.allowNull(), deserializedValues: [null] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: recordSchema.allowNull(), deserializedValues: [undefined] });
    });
    describe('if optional is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: recordSchema.optional(), deserializedValues: [undefined] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: recordSchema.optional(), deserializedValues: [null] });
    });
    describe('if both allowNull and optional are used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: recordSchema.allowNull().optional(), deserializedValues: [null, undefined] });
    });
  });
});
