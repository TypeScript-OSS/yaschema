import { schema } from '..';

const dates = [new Date('2021-01-01T00:00:00.000Z'), new Date('2022-01-01T00:00:00.000Z')];
const unmutatedDates = [...dates];
const dateStrings = dates.map((d) => d.toISOString());
const unmutatedDateStrings = [...dateStrings];

describe('Basic Tests', () => {
  it('Deserializing a Date should work', () => {
    const mySchema = schema.date();
    const deserialization = mySchema.deserialize(dateStrings[0]);
    expect(deserialization.error).toBeUndefined();
    expect(deserialization.deserialized).toEqual(dates[0]);
    expect(dateStrings[0]).toEqual(unmutatedDateStrings[0]);
  });

  it('Deserializing a number should work', () => {
    const mySchema = schema.number();
    const deserialization = mySchema.deserialize(3.14);
    expect(deserialization.error).toBeUndefined();
    expect(deserialization.deserialized).toEqual(3.14);
  });

  it('Serializing a Date should work', () => {
    const mySchema = schema.date();
    const serialization = mySchema.serialize(dates[0]);
    expect(serialization.error).toBeUndefined();
    expect(serialization.serialized).toEqual(dateStrings[0]);
    expect(dates[0]).toEqual(unmutatedDates[0]);
  });

  it('Serializing a number should work', () => {
    const mySchema = schema.number();
    const serialization = mySchema.serialize(3.14);
    expect(serialization.error).toBeUndefined();
    expect(serialization.serialized).toEqual(3.14);
  });

  it('Deserializing an array of Dates should work', () => {
    const mySchema = schema.array({ items: schema.date() });
    const deserialization = mySchema.deserialize(dateStrings);
    expect(deserialization.error).toBeUndefined();
    expect(deserialization.deserialized).toMatchObject(dates);
    expect(dateStrings).toMatchObject(unmutatedDateStrings);
  });

  it('Deserializing an array of numbers should work', () => {
    const mySchema = schema.array({ items: schema.number() });
    const deserialization = mySchema.deserialize([1, 2, 3]);
    expect(deserialization.error).toBeUndefined();
    expect(deserialization.deserialized).toMatchObject([1, 2, 3]);
  });

  it('Serializing an array of Dates should work', () => {
    const mySchema = schema.array({ items: schema.date() });
    const serialization = mySchema.serialize(dates);
    expect(serialization.error).toBeUndefined();
    expect(serialization.serialized).toMatchObject(dateStrings);
    expect(dates).toMatchObject(unmutatedDates);
  });

  it('Serializing an array of numbers should work', () => {
    const mySchema = schema.array({ items: schema.number() });
    const serialization = mySchema.serialize([1, 2, 3]);
    expect(serialization.error).toBeUndefined();
    expect(serialization.serialized).toMatchObject([1, 2, 3]);
  });
});
