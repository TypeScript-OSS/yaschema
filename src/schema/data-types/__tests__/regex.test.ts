import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing';
import * as schema from '../../exports';

describe('regex schema', () => {
  it('schemaType should be "regex"', () => {
    const regexSchema = schema.regex(/^a.*b$/i);

    expect(regexSchema.schemaType).toBe('regex');
  });

  describe('without expected values', () => {
    const regexSchema = schema.regex(/^a.*b$/i);

    setupBasicTypeOperationsShouldWorkTests({ schema: regexSchema, deserializedValues: ['ab', 'accb', 'abbbb', 'abcdb', 'a**********b'] });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: regexSchema,
      deserializedValues: [
        null,
        undefined,
        '',
        'a\nb',
        'one',
        '  two  ',
        'hello',
        '!@#$%^&*()\nQWERTYUIOPASDFGHJKL:ZXCVBNM<>_+{:"<>?',
        [true],
        { one: 1 },
        true,
        false
      ]
    });

    describe('if allowNull is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: regexSchema.allowNull(), deserializedValues: [null] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: regexSchema.allowNull(), deserializedValues: [undefined] });
    });
    describe('if optional is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: regexSchema.optional(), deserializedValues: [undefined] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: regexSchema.optional(), deserializedValues: [null] });
    });
    describe('if both allowNull and optional are used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: regexSchema.allowNull().optional(), deserializedValues: [null, undefined] });
    });
  });
});
