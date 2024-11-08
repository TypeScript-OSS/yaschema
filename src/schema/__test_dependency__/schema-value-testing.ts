import { setAsyncTimeComplexityThreshold } from '../../config/async-time-complexity-threshold.js';
import type { Schema } from '../../types/schema';
import type { ValidationOptions } from '../../types/validation-options.js';

export const setupBasicTypeDeserializationShouldNotWorkTests = ({
  schema,
  serializedValues,
  validationOptions
}: {
  schema: Schema;
  serializedValues: any[];
  validationOptions?: ValidationOptions;
}) => {
  describe('deserialization', () => {
    for (const value of serializedValues) {
      setupAsyncTests(() => {
        it(`of ${String(JSON.stringify(value)).slice(0, 256)} should not work`, async () => {
          const validation = await schema.deserializeAsync(value as any, validationOptions);
          expect(validation.error).toBeDefined();
        });
      });
    }
  });
};

export const setupBasicTypeDeserializationShouldWorkTests = ({
  schema,
  serializedValues,
  deserializedValues,
  validationOptions
}: {
  schema: Schema;
  serializedValues: any[];
  deserializedValues?: any[];
  validationOptions?: ValidationOptions;
}) => {
  describe('deserialization', () => {
    let index = 0;
    for (const value of serializedValues) {
      const thisIndex = index;

      setupAsyncTests(() => {
        it(`of ${String(JSON.stringify(value)).slice(0, 256)} should work`, async () => {
          const validation = await schema.deserializeAsync(value as any, validationOptions);
          expect(validation.deserialized).toEqual(deserializedValues !== undefined ? deserializedValues[thisIndex] : value);
          expect(validation.error).toBeUndefined();
        });
      });

      index += 1;
    }
  });
};

export const setupBasicTypeSerializationShouldNotWorkTests = ({
  schema,
  deserializedValues,
  validationOptions
}: {
  schema: Schema;
  deserializedValues: any[];
  validationOptions?: ValidationOptions;
}) => {
  describe('serialization', () => {
    for (const value of deserializedValues) {
      setupAsyncTests(() => {
        it(`of ${String(JSON.stringify(value)).slice(0, 256)} should not work`, async () => {
          const validation = await schema.serializeAsync(value as any, validationOptions);
          expect(validation.error).toBeDefined();
        });
      });
    }
  });
};

export const setupBasicTypeSerializationShouldWorkTests = ({
  schema,
  deserializedValues,
  serializedValues,
  validationOptions
}: {
  schema: Schema;
  deserializedValues: any[];
  serializedValues?: any[];
  validationOptions?: ValidationOptions;
}) => {
  describe('serialization', () => {
    let index = 0;
    for (const value of deserializedValues) {
      const thisIndex = index;

      setupAsyncTests(() => {
        it(`of ${String(JSON.stringify(value)).slice(0, 256)} should work`, async () => {
          const validation = await schema.serializeAsync(value as any, validationOptions);
          expect(validation.serialized).toEqual(serializedValues !== undefined ? serializedValues[thisIndex] : value);
          expect(validation.error).toBeUndefined();
        });
      });

      index += 1;
    }
  });
};

export const setupBasicTypeValidationShouldNotWorkTests = ({
  schema,
  deserializedValues,
  validationOptions
}: {
  schema: Schema;
  deserializedValues: any[];
  validationOptions?: ValidationOptions;
}) => {
  describe('validation', () => {
    for (const value of deserializedValues) {
      setupAsyncTests(() => {
        it(`of ${String(JSON.stringify(value)).slice(0, 256)} should not work`, async () => {
          const validation = await schema.validateAsync(value as any, validationOptions);
          expect(validation.error).toBeDefined();
        });
      });
    }
  });
};

export const setupBasicTypeValidationShouldWorkTests = ({
  schema,
  deserializedValues,
  validationOptions
}: {
  schema: Schema;
  deserializedValues: any[];
  validationOptions?: ValidationOptions;
}) => {
  describe('validation', () => {
    for (const value of deserializedValues) {
      setupAsyncTests(() => {
        it(`of ${String(JSON.stringify(value)).slice(0, 256)} should work`, async () => {
          const validation = await schema.validateAsync(value as any, validationOptions);
          expect(validation.error).toBeUndefined();
        });
      });
    }
  });
};

export const setupBasicTypeOperationsShouldNotWorkTests = ({
  schema,
  deserializedValues,
  serializedValues,
  validationOptions
}: {
  schema: Schema;
  deserializedValues: any[];
  serializedValues?: any[];
  validationOptions?: ValidationOptions;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  deserializedValues = deserializedValues.map((v) => Object.freeze(v) as any);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  serializedValues = serializedValues?.map((v) => Object.freeze(v) as any);

  setupBasicTypeSerializationShouldNotWorkTests({ schema, deserializedValues, validationOptions });
  setupBasicTypeValidationShouldNotWorkTests({ schema, deserializedValues, validationOptions });
  if (serializedValues !== undefined) {
    setupBasicTypeDeserializationShouldNotWorkTests({ schema, serializedValues, validationOptions });
  } else {
    setupBasicTypeDeserializationShouldNotWorkTests({ schema, serializedValues: deserializedValues, validationOptions });
  }
};

export const setupBasicTypeOperationsShouldWorkTests = ({
  schema,
  deserializedValues,
  serializedValues,
  validationOptions
}: {
  schema: Schema;
  deserializedValues: any[];
  serializedValues?: any[];
  validationOptions?: ValidationOptions;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  deserializedValues = deserializedValues.map((v) => Object.freeze(v) as any);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  serializedValues = serializedValues?.map((v) => Object.freeze(v) as any);

  setupBasicTypeSerializationShouldWorkTests({ schema, deserializedValues, serializedValues, validationOptions });
  setupBasicTypeValidationShouldWorkTests({ schema, deserializedValues, validationOptions });
  if (serializedValues !== undefined) {
    setupBasicTypeDeserializationShouldWorkTests({ schema, serializedValues, deserializedValues, validationOptions });
  } else {
    setupBasicTypeDeserializationShouldWorkTests({ schema, serializedValues: deserializedValues, validationOptions });
  }
};

// Helpers

const setupAsyncTests = (setupTests: () => void) => {
  describe('async', () => {
    describe('with default async time complexity threshold', () => {
      setupTests();
    });

    describe('with very small async time complexity threshold', () => {
      beforeAll(() => setAsyncTimeComplexityThreshold(1));
      afterAll(() => setAsyncTimeComplexityThreshold(undefined));

      setupTests();
    });
  });
};
