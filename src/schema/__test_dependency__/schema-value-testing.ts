import { setAsyncTimeComplexityThreshold } from '../../config/async-time-complexity-threshold.js';
import type { Schema } from '../../types/schema';

export const setupBasicTypeDeserializationShouldNotWorkTests = ({
  schema,
  serializedValues
}: {
  schema: Schema;
  serializedValues: any[];
}) => {
  describe('deserialization', () => {
    for (const value of serializedValues) {
      describe('sync', () => {
        it(`of ${String(JSON.stringify(value)).slice(0, 256)} should not work`, () => {
          const validation = schema.deserialize(value as any);
          expect(validation.error).toBeDefined();
        });
      });

      setupAsyncTests(() => {
        it(`of ${String(JSON.stringify(value)).slice(0, 256)} should not work`, async () => {
          const validation = await schema.deserializeAsync(value as any);
          expect(validation.error).toBeDefined();
        });
      });
    }
  });
};

export const setupBasicTypeDeserializationShouldWorkTests = ({
  schema,
  serializedValues,
  deserializedValues
}: {
  schema: Schema;
  serializedValues: any[];
  deserializedValues?: any[];
}) => {
  describe('deserialization', () => {
    let index = 0;
    for (const value of serializedValues) {
      const thisIndex = index;

      describe('sync', () => {
        it(`of ${String(JSON.stringify(value)).slice(0, 256)} should work`, () => {
          const validation = schema.deserialize(value as any);
          expect(validation.deserialized).toEqual(deserializedValues !== undefined ? deserializedValues[thisIndex] : value);
          expect(validation.error).toBeUndefined();
        });
      });

      setupAsyncTests(() => {
        it(`of ${String(JSON.stringify(value)).slice(0, 256)} should work`, async () => {
          const validation = await schema.deserializeAsync(value as any);
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
  deserializedValues
}: {
  schema: Schema;
  deserializedValues: any[];
}) => {
  describe('serialization', () => {
    for (const value of deserializedValues) {
      describe('sync', () => {
        it(`of ${String(JSON.stringify(value)).slice(0, 256)} should not work`, () => {
          const validation = schema.serialize(value as any);
          expect(validation.error).toBeDefined();
        });
      });

      setupAsyncTests(() => {
        it(`of ${String(JSON.stringify(value)).slice(0, 256)} should not work`, async () => {
          const validation = await schema.serializeAsync(value as any);
          expect(validation.error).toBeDefined();
        });
      });
    }
  });
};

export const setupBasicTypeSerializationShouldWorkTests = ({
  schema,
  deserializedValues,
  serializedValues
}: {
  schema: Schema;
  deserializedValues: any[];
  serializedValues?: any[];
}) => {
  describe('serialization', () => {
    let index = 0;
    for (const value of deserializedValues) {
      const thisIndex = index;

      describe('sync', () => {
        it(`of ${String(JSON.stringify(value)).slice(0, 256)} should work`, () => {
          const validation = schema.serialize(value as any);
          expect(validation.serialized).toEqual(serializedValues !== undefined ? serializedValues[thisIndex] : value);
          expect(validation.error).toBeUndefined();
        });
      });

      setupAsyncTests(() => {
        it(`of ${String(JSON.stringify(value)).slice(0, 256)} should work`, async () => {
          const validation = await schema.serializeAsync(value as any);
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
  deserializedValues
}: {
  schema: Schema;
  deserializedValues: any[];
}) => {
  describe('validation', () => {
    for (const value of deserializedValues) {
      describe('sync', () => {
        it(`of ${String(JSON.stringify(value)).slice(0, 256)} should not work`, () => {
          const validation = schema.validate(value as any);
          expect(validation.error).toBeDefined();
        });
      });

      setupAsyncTests(() => {
        it(`of ${String(JSON.stringify(value)).slice(0, 256)} should not work`, async () => {
          const validation = await schema.validateAsync(value as any);
          expect(validation.error).toBeDefined();
        });
      });
    }
  });
};

export const setupBasicTypeValidationShouldWorkTests = ({ schema, deserializedValues }: { schema: Schema; deserializedValues: any[] }) => {
  describe('validation', () => {
    for (const value of deserializedValues) {
      describe('sync', () => {
        it(`of ${String(JSON.stringify(value)).slice(0, 256)} should work`, () => {
          const validation = schema.validate(value as any);
          expect(validation.error).toBeUndefined();
        });
      });

      setupAsyncTests(() => {
        it(`of ${String(JSON.stringify(value)).slice(0, 256)} should work`, async () => {
          const validation = await schema.validateAsync(value as any);
          expect(validation.error).toBeUndefined();
        });
      });
    }
  });
};

export const setupBasicTypeOperationsShouldNotWorkTests = ({
  schema,
  deserializedValues,
  serializedValues
}: {
  schema: Schema;
  deserializedValues: any[];
  serializedValues?: any[];
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  deserializedValues = deserializedValues.map((v) => Object.freeze(v) as any);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  serializedValues = serializedValues?.map((v) => Object.freeze(v) as any);

  setupBasicTypeSerializationShouldNotWorkTests({ schema, deserializedValues });
  setupBasicTypeValidationShouldNotWorkTests({ schema, deserializedValues });
  if (serializedValues !== undefined) {
    setupBasicTypeDeserializationShouldNotWorkTests({ schema, serializedValues });
  } else {
    setupBasicTypeDeserializationShouldNotWorkTests({ schema, serializedValues: deserializedValues });
  }
};

export const setupBasicTypeOperationsShouldWorkTests = ({
  schema,
  deserializedValues,
  serializedValues
}: {
  schema: Schema;
  deserializedValues: any[];
  serializedValues?: any[];
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  deserializedValues = deserializedValues.map((v) => Object.freeze(v) as any);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  serializedValues = serializedValues?.map((v) => Object.freeze(v) as any);

  setupBasicTypeSerializationShouldWorkTests({ schema, deserializedValues, serializedValues: serializedValues });
  setupBasicTypeValidationShouldWorkTests({ schema, deserializedValues });
  if (serializedValues !== undefined) {
    setupBasicTypeDeserializationShouldWorkTests({ schema, serializedValues, deserializedValues });
  } else {
    setupBasicTypeDeserializationShouldWorkTests({ schema, serializedValues: deserializedValues });
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
