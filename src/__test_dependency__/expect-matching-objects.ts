export const expectMatchingObjects = (a: any, b: any) => {
  expect(a).toMatchObject(b);
  expect(b).toMatchObject(a);
};
