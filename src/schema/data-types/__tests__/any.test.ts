import { Blob } from 'node-fetch';

import type { JsonObject } from '../../../exports';
import { schema } from '../../../exports.js';
import {
  setupBasicTypeOperationsShouldNotWorkTests,
  setupBasicTypeOperationsShouldWorkTests
} from '../../__test_dependency__/schema-value-testing.js';

describe('any schema', () => {
  const anySchema = schema.any();

  it('schemaType should be "any"', () => {
    expect(anySchema.schemaType).toBe('any');
  });

  setupBasicTypeOperationsShouldWorkTests({ schema: anySchema, deserializedValues: [true, false, 3, 'hello', [true], { one: 1 }] });
  setupBasicTypeOperationsShouldNotWorkTests({ schema: anySchema, deserializedValues: [null, undefined] });

  describe('if allowNull is used', () => {
    setupBasicTypeOperationsShouldWorkTests({ schema: anySchema.allowNull(), deserializedValues: [null] });
    setupBasicTypeOperationsShouldNotWorkTests({ schema: anySchema.allowNull(), deserializedValues: [undefined] });
  });
  describe('if optional is used', () => {
    setupBasicTypeOperationsShouldWorkTests({ schema: anySchema.optional(), deserializedValues: [undefined] });
    setupBasicTypeOperationsShouldNotWorkTests({ schema: anySchema.optional(), deserializedValues: [null] });
  });
  describe('if both allowNull and optional are used', () => {
    setupBasicTypeOperationsShouldWorkTests({ schema: anySchema.allowNull().optional(), deserializedValues: [null, undefined] });
  });
  describe('if not(schema.boolean(false)) is used', () => {
    setupBasicTypeOperationsShouldWorkTests({ schema: anySchema.not(schema.boolean(false)), deserializedValues: [true] });
    setupBasicTypeOperationsShouldNotWorkTests({ schema: anySchema.not(schema.boolean(false)), deserializedValues: [false] });
  });

  describe('complex objects', () => {
    it('blob', async () => {
      const complexSchema = schema.object({ blob: schema.any() });

      const serialized = await complexSchema.serializeAsync({ blob: new Blob([Buffer.from('hi there', 'utf-8')]) });
      expect(serialized.error).toBeUndefined();
      expect((serialized.serialized! as JsonObject).blob).toBeInstanceOf(Blob);
    });
  });
});
