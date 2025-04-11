import { schema } from '../exports.js';

describe('stringify and parse', () => {
  it('stringyAsync and parseAsync should work', async () => {
    const mySchema = schema.array({ items: schema.number() });
    const jsonString = await mySchema.stringifyAsync([1, 2, 3]);
    expect(jsonString).toStrictEqual('[1,2,3]');

    const value = await mySchema.parseAsync(jsonString);
    expect(value).toMatchObject([1, 2, 3]);
  });

  it('stringy and parse should work', async () => {
    const mySchema = schema.array({ items: schema.number() });
    const jsonString = mySchema.stringify([1, 2, 3]);
    expect(jsonString).toStrictEqual('[1,2,3]');

    const value = mySchema.parse(jsonString);
    expect(value).toMatchObject([1, 2, 3]);
  });
});
