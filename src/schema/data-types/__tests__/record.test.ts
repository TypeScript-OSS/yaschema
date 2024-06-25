import { schema } from '../../../exports.js';
import {
  setupBasicTypeDeserializationShouldWorkTests,
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests,
  setupBasicTypeSerializationShouldWorkTests,
  setupBasicTypeValidationShouldWorkTests
} from '../../__test_dependency__/schema-value-testing.js';

describe('record schema', () => {
  it('schemaType should be "record"', () => {
    const recordSchema = schema.record(schema.string('hello', 'world'), schema.number());

    expect(recordSchema.schemaType).toBe('record');
  });

  describe('with basic sub-elements', () => {
    const recordSchema = schema.record(schema.string('hello', 'world'), schema.number());

    setupBasicTypeOperationsShouldWorkTests({
      schema: recordSchema,
      deserializedValues: [{}, { hello: 3 }, { world: 3.14 }, { hello: 3, world: 3.14 }]
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

    setupBasicTypeSerializationShouldWorkTests({
      schema: recordSchema,
      deserializedValues: [{ hello: 3, foo: 'hello' }, { foo: 'hello' }],
      serializedValues: [{ hello: 3 }, {}]
    });
    setupBasicTypeDeserializationShouldWorkTests({
      schema: recordSchema,
      serializedValues: [{ hello: 3, foo: 'hello' }, { foo: 'hello' }],
      deserializedValues: [{ hello: 3 }, {}]
    });
    setupBasicTypeValidationShouldWorkTests({
      schema: recordSchema,
      deserializedValues: [{ hello: 3, foo: 'hello' }, { foo: 'hello' }]
    });
  });
});
