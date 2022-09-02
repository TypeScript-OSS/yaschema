import BigNumber from 'bignumber.js';

import { schema } from '..';
import { bigNumberSchema } from '../schema/__test_dependency__/big-number-schema';

describe('soft validation mode', () => {
  it('valid fields should serialize as expected even when there are validation errors', () => {
    const mySchema = schema.object({
      date1: schema.date(),
      date2: schema.date(),
      value: bigNumberSchema
    });

    const serialization = mySchema.serialize(
      {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        date1: 'hello' as any,
        date2: new Date('2022-01-01T00:00:00.000Z'),
        value: new BigNumber(3.14)
      },
      { validation: 'soft' }
    );
    expect(serialization.error).toBeDefined();
    expect(serialization.errorLevel).toBe('warning');
    expect(serialization.serialized).toMatchObject({
      date1: 'hello',
      date2: '2022-01-01T00:00:00.000Z',
      value: { bignumber: '3.14' }
    });
  });
});

describe('hard validation mode', () => {
  it('valid fields should serialize as expected even when there are validation errors', () => {
    const mySchema = schema.object({
      date1: schema.date(),
      date2: schema.date(),
      value: bigNumberSchema
    });

    const serialization = mySchema.serialize(
      {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        date1: 'hello' as any,
        date2: new Date('2022-01-01T00:00:00.000Z'),
        value: new BigNumber(3.14)
      },
      { validation: 'hard' }
    );
    expect(serialization.error).toBeDefined();
    expect(serialization.serialized).toMatchObject({
      date1: 'hello',
      date2: new Date('2022-01-01T00:00:00.000Z'),
      value: new BigNumber(3.14)
    });
  });
});

describe('none validation mode', () => {
  it('valid fields should serialize as expected even when there are validation errors', () => {
    const mySchema = schema.restrictedNumber([3]);

    const serialization = mySchema.serialize(5, { validation: 'none' });
    expect(serialization.error).toBeUndefined();
    expect(serialization.serialized).toBe(5);
  });
});
