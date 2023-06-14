import _ from 'lodash';

export const cloner =
  <T>(value: T) =>
  () =>
    _.cloneDeep(value);
