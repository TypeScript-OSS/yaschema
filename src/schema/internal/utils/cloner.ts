import { safeClone } from '../../../internal/utils/safeClone.js';

export const cloner =
  <T>(value: T) =>
  () =>
    safeClone(value);
