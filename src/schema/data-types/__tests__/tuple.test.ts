import { schema } from '../../..';
import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing';

describe('tuple schema', () => {
  it('schemaType should be "tuple"', () => {
    const tupleSchema = schema.tuple({ items: [schema.string(), schema.number()] });

    expect(tupleSchema.schemaType).toBe('tuple');
  });

  describe('with zero items', () => {
    const tupleSchema = schema.tuple({ items: [] });

    setupBasicTypeOperationsShouldWorkTests({ schema: tupleSchema, deserializedValues: [[]] });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: tupleSchema,
      deserializedValues: [null, undefined, '', [true], true, false, { hello: 'world' }]
    });

    describe('if allowNull is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: tupleSchema.allowNull(), deserializedValues: [null] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: tupleSchema.allowNull(), deserializedValues: [undefined] });
    });
    describe('if optional is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: tupleSchema.optional(), deserializedValues: [undefined] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: tupleSchema.optional(), deserializedValues: [null] });
    });
    describe('if both allowNull and optional are used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: tupleSchema.allowNull().optional(), deserializedValues: [null, undefined] });
    });
  });

  describe('with two items', () => {
    const tupleSchema = schema.tuple({ items: [schema.string(), schema.number()] });

    setupBasicTypeOperationsShouldWorkTests({
      schema: tupleSchema,
      deserializedValues: [
        ['hello', 1],
        ['world', 3.14]
      ]
    });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: tupleSchema,
      deserializedValues: [null, undefined, '', [true], true, false, { hello: 'world' }]
    });

    describe('if allowNull is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: tupleSchema.allowNull(), deserializedValues: [null] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: tupleSchema.allowNull(), deserializedValues: [undefined] });
    });
    describe('if optional is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: tupleSchema.optional(), deserializedValues: [undefined] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: tupleSchema.optional(), deserializedValues: [null] });
    });
    describe('if both allowNull and optional are used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: tupleSchema.allowNull().optional(), deserializedValues: [null, undefined] });
    });
  });
});
