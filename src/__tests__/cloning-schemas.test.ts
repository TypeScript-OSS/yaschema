import { schema } from '../exports.js';

describe('cloning schemas', () => {
  it('objects should work', () => {
    const mySchema = schema
      .object({
        x: schema.object({ y: schema.number().setDescription('Some number') }).setDescription('Another object')
      })
      .setDescription('Some object')
      .setExample('{ x: { y: 3.14 } }');
    const clonedSchema = mySchema.clone().setDescription('A new description').setExample('A new example');

    expect(mySchema.description).toBe('Some object');
    expect(mySchema.example).toBe('{ x: { y: 3.14 } }');
    expect(mySchema.map.x.description).toBe('Another object');

    expect(clonedSchema.description).toBe('A new description');
    expect(clonedSchema.example).toBe('A new example');
    expect(clonedSchema.map.x.description).toBe('Another object');

    expect(mySchema.map.x).toBe(clonedSchema.map.x);
  });
});
