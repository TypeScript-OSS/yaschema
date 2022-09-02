import { schema } from '../../..';
import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing';

describe('string schema', () => {
  it('schemaType should be "string"', () => {
    const stringSchema = schema.string();

    expect(stringSchema.schemaType).toBe('string');
  });

  describe('without expected values', () => {
    const stringSchema = schema.string();

    setupBasicTypeOperationsShouldWorkTests({
      schema: stringSchema,
      deserializedValues: ['one', '  two  ', 'hello', '!@#$%^&*()\nQWERTYUIOPASDFGHJKL:ZXCVBNM<>_+{:"<>?']
    });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: stringSchema,
      deserializedValues: [null, undefined, '', [true], { one: 1 }, true, false]
    });

    describe('if allowNull is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: stringSchema.allowNull(), deserializedValues: [null] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: stringSchema.allowNull(), deserializedValues: [undefined] });
    });
    describe('if optional is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: stringSchema.optional(), deserializedValues: [undefined] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: stringSchema.optional(), deserializedValues: [null] });
    });
    describe('if both allowNull and optional are used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: stringSchema.allowNull().optional(), deserializedValues: [null, undefined] });
    });
  });

  describe('with expected true value', () => {
    const stringSchema = schema.string('hello', 'world');

    setupBasicTypeOperationsShouldWorkTests({ schema: stringSchema, deserializedValues: ['hello', 'world'] });
    setupBasicTypeOperationsShouldNotWorkTests({ schema: stringSchema, deserializedValues: ['hi', 'there'] });
  });

  describe('with allowEmptyString', () => {
    const stringSchema = schema.string().allowEmptyString();

    setupBasicTypeOperationsShouldWorkTests({ schema: stringSchema, deserializedValues: ['', 'hello', 'world'] });
  });
});
