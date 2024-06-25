import { schema } from '../../../exports.js';
import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing.js';

describe('number schema', () => {
  it('schemaType should be "number"', () => {
    const numberSchema = schema.number();

    expect(numberSchema.schemaType).toBe('number');
  });

  describe('without expected values', () => {
    const numberSchema = schema.number();

    setupBasicTypeOperationsShouldWorkTests({ schema: numberSchema, deserializedValues: [-100, -3.14, -1, 0, 1, 3.14, 100] });
    setupBasicTypeOperationsShouldNotWorkTests({
      schema: numberSchema,
      deserializedValues: [null, undefined, 'hello', [true], { one: 1 }, true, false, NaN, Number.NEGATIVE_INFINITY, Number]
    });

    describe('if allowNull is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: numberSchema.allowNull(), deserializedValues: [null] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: numberSchema.allowNull(), deserializedValues: [undefined] });
    });
    describe('if optional is used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: numberSchema.optional(), deserializedValues: [undefined] });
      setupBasicTypeOperationsShouldNotWorkTests({ schema: numberSchema.optional(), deserializedValues: [null] });
    });
    describe('if both allowNull and optional are used', () => {
      setupBasicTypeOperationsShouldWorkTests({ schema: numberSchema.allowNull().optional(), deserializedValues: [null, undefined] });
    });
  });

  describe('with expected true value', () => {
    const numberSchema = schema.number(3, 5);

    setupBasicTypeOperationsShouldWorkTests({ schema: numberSchema, deserializedValues: [3, 5] });
    setupBasicTypeOperationsShouldNotWorkTests({ schema: numberSchema, deserializedValues: [1, 7] });
  });

  describe("with setAllowedSerializationForms(['string'])", () => {
    const numberSchema = schema.number(3, 5).setAllowedSerializationForms(['string']);

    setupBasicTypeOperationsShouldWorkTests({ schema: numberSchema, deserializedValues: [3, 5], serializedValues: ['3', '5'] });

    it('serialization and deserialization should work', () => {
      expect(numberSchema.serialize(3).serialized).toBe('3');
      expect(numberSchema.deserialize('3').deserialized).toBe(3);
      expect(numberSchema.deserialize(3).error).toBeDefined();
    });
  });

  describe("with setAllowedSerializationForms(['string', 'number'])", () => {
    const numberSchema = schema.number(3, 5).setAllowedSerializationForms(['string', 'number']);

    setupBasicTypeOperationsShouldWorkTests({ schema: numberSchema, deserializedValues: [3, 5], serializedValues: ['3', '5'] });

    it('serialization and deserialization should work', () => {
      expect(numberSchema.serialize(3).serialized).toBe('3');
      expect(numberSchema.deserialize('3').deserialized).toBe(3);
      expect(numberSchema.deserialize(3).deserialized).toBe(3);
    });
  });

  describe("with setAllowedSerializationForms(['number', 'string'])", () => {
    const numberSchema = schema.number(3, 5).setAllowedSerializationForms(['number', 'string']);

    setupBasicTypeOperationsShouldWorkTests({ schema: numberSchema, deserializedValues: [3, 5], serializedValues: [3, 5] });

    it('serialization and deserialization should work', () => {
      expect(numberSchema.serialize(3).serialized).toBe(3);
      expect(numberSchema.deserialize('3').deserialized).toBe(3);
      expect(numberSchema.deserialize(3).deserialized).toBe(3);
    });
  });
});
